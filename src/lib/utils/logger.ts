/* eslint-disable no-console */
type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "production") {
    // In production: structured JSON output for log aggregators
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
  } else {
    // In development: readable format
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
    if (data !== undefined) {
      console[level === "debug" ? "log" : level](prefix, message, data);
    } else {
      console[level === "debug" ? "log" : level](prefix, message);
    }
  }
}

export const logger = {
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      log("debug", message, data);
    }
  },
};
