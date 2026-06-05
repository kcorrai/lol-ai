/* eslint-disable no-console */
import { getRequestId } from "@/lib/context/requestContext";

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  data?: unknown;
  timestamp: string;
}

function serializeData(data: unknown): unknown {
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      ...data,
    };
  }
  return data;
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    requestId: getRequestId(),
    data: serializeData(data),
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "production") {
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
  } else {
    const requestTag = entry.requestId ? ` [${entry.requestId.slice(0, 8)}]` : "";
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]${requestTag}`;
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
