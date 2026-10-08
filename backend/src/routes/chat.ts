import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { env } from "../env.js";
import { runChat, mensajeDeError, type ChatEvent } from "../chat/agent.js";

export const MAX_MENSAJES = 20;
export const MAX_CARACTERES_USUARIO = 1000;

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({
          role: z.literal("user"),
          content: z
            .string()
            .trim()
            .min(1, "El mensaje está vacío")
            .max(MAX_CARACTERES_USUARIO, `Cada mensaje puede tener máximo ${MAX_CARACTERES_USUARIO} caracteres`),
        }),
        // Las respuestas previas del asistente vuelven desde el navegador; se limita su tamaño.
        z.object({ role: z.literal("assistant"), content: z.string().trim().min(1).max(8000) }),
      ]),
    )
    .min(1)
    .max(MAX_MENSAJES, `La conversación llegó al límite de ${MAX_MENSAJES} mensajes. Inicia una nueva.`)
    .refine((m) => m[0]?.role === "user" && m[m.length - 1]?.role === "user", {
      message: "La conversación debe empezar y terminar con un mensaje del usuario",
    })
    .refine((m) => m.every((msg, i) => i === 0 || msg.role !== m[i - 1]!.role), {
      message: "Los mensajes deben alternar entre usuario y asistente",
    }),
});

export const chatRouter = Router();

chatRouter.post(
  "/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Has enviado muchos mensajes. Espera unos minutos y vuelve a intentarlo." },
  }),
  async (req, res) => {
    const parsed = ChatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Solicitud inválida" });
      return;
    }
    if (!env.ANTHROPIC_API_KEY) {
      res.status(503).json({ error: "El cotizador no está disponible en este momento. Escríbenos por WhatsApp." });
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // evita que un proxy intermedio acumule el stream
    });
    res.flushHeaders();

    const controller = new AbortController();
    res.on("close", () => controller.abort());

    const emit = (event: ChatEvent) => {
      if (!res.writableEnded) res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    // Comentario SSE periódico para que proxies no cierren la conexión mientras el modelo piensa.
    const keepAlive = setInterval(() => {
      if (!res.writableEnded) res.write(": ping\n\n");
    }, 15_000);

    try {
      await runChat(parsed.data.messages, emit, controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("[chat] error", err);
        emit({ type: "error", message: mensajeDeError(err) });
      }
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
  },
);
