/**
 * CleanCity — Realtime Service
 * ─────────────────────────────
 * Handles:
 *   • WebSocket connections (Socket.IO) for live updates
 *   • JWT auth on socket handshake
 *   • Internal REST endpoint (/internal/emit) called by FastAPI
 *   • Room-based event routing: citizen:{id}, collector:{id}, admin, zone:{id}
 *
 * Start:  node index.js  |  npm run dev
 */

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "./middleware/logger.js";
import { registerTaskHandlers } from "./handlers/taskEvents.js";
import { registerNotificationHandlers } from "./handlers/notifications.js";

const PORT = process.env.PORT ?? 4000;
const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production-use-a-long-random-string";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", service: "realtime" }));

// ── Internal endpoint — called by FastAPI to push events ──────────────────────
app.post("/internal/emit", (req, res) => {
  const { event, payload } = req.body ?? {};
  if (!event) return res.status(400).json({ error: "Missing event name" });

  logger.info(`[internal] emit  event=${event}`, payload);
  routeEvent(io, event, payload);
  res.json({ ok: true });
});

// ── HTTP + Socket.IO server ───────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── JWT middleware on socket handshake ────────────────────────────────────────
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ??
    socket.handshake.headers?.authorization?.replace("Bearer ", "");

  if (!token) return next(new Error("Missing auth token"));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.userId = decoded.sub;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

// ── Connection handling ───────────────────────────────────────────────────────
io.on("connection", (socket) => {
  const { userId, role } = socket.data;
  logger.info(`[socket] connected  userId=${userId} role=${role} sid=${socket.id}`);

  // Join personal room + role room
  socket.join(`user:${userId}`);
  socket.join(role);                  // "citizen" | "collector" | "admin"

  // Let the client subscribe to a zone room
  socket.on("join:zone", (zoneId) => {
    socket.join(`zone:${zoneId}`);
    logger.debug(`[socket] ${userId} joined zone:${zoneId}`);
  });

  // Register domain-specific handlers
  registerTaskHandlers(socket, io);
  registerNotificationHandlers(socket, io);

  socket.on("disconnect", (reason) => {
    logger.info(`[socket] disconnected  userId=${userId} reason=${reason}`);
  });
});

// ── Event router — maps FastAPI events → Socket.IO rooms ─────────────────────
function routeEvent(io, event, payload) {
  switch (event) {
    case "report:created":
      // Notify all admins and the zone
      io.to("admin").emit(event, payload);
      if (payload.zone_id) io.to(`zone:${payload.zone_id}`).emit(event, payload);
      break;

    case "report:status_changed":
      // Notify the specific citizen + assigned collector + admins
      io.to(`user:${payload.citizen_id}`).emit(event, payload);
      if (payload.collector_id) io.to(`user:${payload.collector_id}`).emit(event, payload);
      io.to("admin").emit(event, payload);
      break;

    case "task:assigned":
      // Notify just the collector
      if (payload.collector_id) io.to(`user:${payload.collector_id}`).emit(event, payload);
      io.to("admin").emit(event, payload);
      break;

    default:
      // Broadcast to admins as a catch-all for custom events
      io.to("admin").emit(event, payload);
  }
}

// ── Start ──────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  logger.info(`✅  Realtime service listening on port ${PORT}`);
  logger.info(`   WebSocket: ws://localhost:${PORT}`);
  logger.info(`   Internal:  http://localhost:${PORT}/internal/emit`);
});

export { io };
