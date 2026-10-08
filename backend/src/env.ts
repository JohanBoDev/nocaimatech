import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL es obligatoria"),
  // Opcionales al arrancar: sin API key la landing y la lista de espera funcionan,
  // y /api/chat responde con un error amigable.
  ANTHROPIC_API_KEY: z.string().optional(),
  MODEL_CHAT: z.string().min(1).default("claude-opus-5-5"),
  // Nivel de esfuerzo del modelo (low | medium | high). Vacío = valor por defecto del modelo.
  CHAT_EFFORT: z.enum(["low", "medium", "high", ""]).default("low"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;

/** FRONTEND_URL admite varios orígenes separados por coma (p. ej. dominio y www). */
export const allowedOrigins = env.FRONTEND_URL.split(",").map((o) => o.trim().replace(/\/$/, ""));
