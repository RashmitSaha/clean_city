import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "HH:mm:ss" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const extra = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
      return `${timestamp} [${level}] ${message}${extra}`;
    })
  ),
  transports: [new transports.Console()],
});

export default logger;
