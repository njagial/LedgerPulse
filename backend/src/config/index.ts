import "dotenv/config";
import { z } from "zod";

const configSchema = z.object({
  port: z.coerce.number().default(3001),
  host: z.string().default("0.0.0.0"),
  databaseUrl: z.string(),
  redisUrl: z.string().default("redis://localhost:6379"),
  openaiApiKey: z.string(),
  webhookSecret: z.string(),
  uploadDir: z.string().default("./uploads"),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function loadConfig(): Config {
  if (_config) return _config;
  _config = configSchema.parse({
    port: process.env.PORT,
    host: process.env.HOST,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    webhookSecret: process.env.WEBHOOK_SECRET,
    uploadDir: process.env.UPLOAD_DIR,
  });
  return _config;
}
