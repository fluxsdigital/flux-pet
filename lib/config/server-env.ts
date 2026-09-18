import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_TIMEZONE: z.literal("America/Sao_Paulo").default("America/Sao_Paulo"),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type ServerEnv = z.infer<typeof schema>;

export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  return schema.parse(input);
}

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
