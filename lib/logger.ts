import pino from "pino";

let instance: pino.Logger | undefined;

export function getLogger(): pino.Logger {
  instance ??= pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: { service: "flux-pet" },
    redact: ["password", "token", "authorization", "cookie", "req.headers.authorization", "req.headers.cookie"],
  });
  return instance;
}
