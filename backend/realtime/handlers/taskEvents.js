/**
 * Task event handlers — collector-side socket events.
 * The collector client emits these; we broadcast the outcome to relevant rooms.
 */
import logger from "../middleware/logger.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export function registerTaskHandlers(socket, io) {
  const { userId, role } = socket.data;

  // Collector starts working on a task
  socket.on("task:start", ({ taskId }) => {
    if (role !== "collector") return;
    logger.info(`[task] start  collector=${userId} task=${taskId}`);
    io.to("admin").emit("task:started", { taskId, collectorId: userId });
  });

  // Collector marks task complete
  socket.on("task:complete", ({ taskId, notes }) => {
    if (role !== "collector") return;
    logger.info(`[task] complete  collector=${userId} task=${taskId}`);
    io.to("admin").emit("task:completed", { taskId, collectorId: userId, notes });
    // The FastAPI PATCH will handle DB update + citizen notification via /internal/emit
  });

  // Collector shares live location while on a job
  socket.on("collector:location", ({ taskId, lat, lng }) => {
    if (role !== "collector") return;
    // Broadcast to admins and any citizen watching that report
    io.to("admin").emit("collector:location", { taskId, collectorId: userId, lat, lng });
  });
}
