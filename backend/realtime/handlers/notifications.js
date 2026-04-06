/**
 * Notification handlers — citizens and admins receive push events.
 */
import logger from "../middleware/logger.js";

/**
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
export function registerNotificationHandlers(socket, io) {
  const { userId, role } = socket.data;

  // Client acknowledges it received a notification
  socket.on("notification:ack", ({ notificationId }) => {
    logger.debug(`[notify] ack  userId=${userId} id=${notificationId}`);
    // Persist ack to DB via REST call to FastAPI (fire-and-forget)
    fetch(`${process.env.API_URL ?? "http://localhost:8000"}/api/notifications/${notificationId}/ack`, {
      method: "POST",
      headers: { "X-Internal-Token": process.env.INTERNAL_TOKEN ?? "" },
    }).catch(() => {});
  });

  // Admin broadcasts a system-wide alert
  socket.on("admin:broadcast", ({ message, severity }) => {
    if (role !== "admin") return;
    logger.info(`[notify] broadcast  from=${userId}  msg=${message}`);
    io.emit("system:alert", { message, severity: severity ?? "info", sentBy: userId });
  });
}
