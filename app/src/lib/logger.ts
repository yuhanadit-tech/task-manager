/**
 * Lightweight structured logger.
 * Uses console in all environments but formats output as JSON
 * so log aggregators (Vercel, Datadog, etc.) can parse it.
 *
 * Rules per Rules.md:
 *  - NEVER log sensitive data (passwords, tokens, PII)
 *  - Always include a structured context object
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In production ship JSON; in development keep it readable
  if (process.env.NODE_ENV === "production") {
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
  } else {
    console[level === "debug" ? "log" : level](`[${level.toUpperCase()}] ${message}`, context);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};
