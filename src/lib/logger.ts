const IS_PROD = process.env.NODE_ENV === "production";

export type LogLevel = "error" | "warn" | "info" | "success" | "debug";

interface LogOptions {
  fn?: string;
  message: unknown;
  meta?: unknown;
}

const DIVIDER = "─────────────────────────────────────────────";

const parseMessage = (input: unknown): string => {
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message;

  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return "Unknown error";
  }
};

const log = (level: LogLevel, { fn, message, meta }: LogOptions) => {
  if (IS_PROD && level !== "error") return;

  const time = new Date().toISOString();
  const msg = parseMessage(message);

  const prefixMap: Record<LogLevel, string> = {
    error: "❌ ERROR",
    warn: "⚠️ WARNING",
    info: "ℹ️ INFO",
    success: "✅ SUCCESS",
    debug: "🐛 DEBUG",
  };

  const prefix = prefixMap[level];

  const output = `
${prefix} ${fn ? `in [${fn}]` : ""}
🕒 ${time}
${DIVIDER}
${msg}
${meta ? `\nMETA: ${parseMessage(meta)}` : ""}
${DIVIDER}
`;

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "info":
      console.info(output);
      break;
    case "success":
      console.log(output);
      break;
    case "debug":
      console.debug(output);
      break;
  }
};

export const logger = {
  error: (opts: LogOptions) => log("error", opts),
  warn: (opts: LogOptions) => log("warn", opts),
  info: (opts: LogOptions) => log("info", opts),
  success: (opts: LogOptions) => log("success", opts),
  debug: (opts: LogOptions) => log("debug", opts),
};
