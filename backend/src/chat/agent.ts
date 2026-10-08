import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { describirHerramienta, ejecutarHerramienta, TOOLS } from "./tools.js";

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "status"; message: string }
  | { type: "done" }
  | { type: "error"; message: string };

/** Máximo de vueltas modelo → herramientas → modelo por mensaje del usuario. */
const MAX_ITERACIONES = 8;
/** Suficiente para pensar, llamar herramientas y escribir la tabla final. */
const MAX_TOKENS = 8192;
/** Modelos que aceptan `fallbacks: "default"` (reintento en otro modelo si un clasificador rechaza). */
const MODELOS_CON_FALLBACK = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 2,
    // Las claves no ligadas a un workspace exigen indicarlo en cada petición.
    ...(env.ANTHROPIC_WORKSPACE_ID ? { defaultHeaders: { "anthropic-workspace-id": env.ANTHROPIC_WORKSPACE_ID } } : {}),
  });
  return client;
}

export class ChatError extends Error {}

/**
 * Tras un fallback a mitad de respuesta, los bloques de thinking/tool_use anteriores al
 * último bloque `fallback` no deben reenviarse al modelo.
 */
function contenidoParaHistorial(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  const corte = content.findLastIndex((b) => b.type === "fallback");
  const omitir = new Set(["thinking", "redacted_thinking", "tool_use", "server_tool_use"]);
  return content.filter((b, i) => i > corte || !omitir.has(b.type)) as Anthropic.Beta.BetaContentBlockParam[];
}

export async function runChat(
  historial: Anthropic.Beta.BetaMessageParam[],
  emit: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const messages = [...historial];
  const usarFallback = MODELOS_CON_FALLBACK.has(env.MODEL_CHAT);
  let huboTexto = false;
  let reintentosJson = 0;

  for (let i = 0; i < MAX_ITERACIONES; i++) {
    const stream = getClient().beta.messages.stream(
      {
        model: env.MODEL_CHAT,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
        ...(env.CHAT_EFFORT ? { output_config: { effort: env.CHAT_EFFORT } } : {}),
        ...(usarFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      },
      { signal },
    );

    let separadorPendiente = huboTexto;
    stream.on("text", (delta) => {
      if (separadorPendiente) {
        emit({ type: "text", text: "\n\n" });
        separadorPendiente = false;
      }
      huboTexto = true;
      emit({ type: "text", text: delta });
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
      reintentosJson = 0;
    } catch (err) {
      // Con eager_input_streaming, un input de herramienta ilegible rechaza finalMessage():
      // se reintenta el turno. Los errores de la API se propagan.
      if (err instanceof Anthropic.APIError || signal.aborted || reintentosJson++ >= 2) throw err;
      console.warn("[chat] input de herramienta ilegible, reintentando turno");
      continue;
    }

    if (message.stop_reason === "refusal") {
      throw new ChatError("No puedo ayudarte con esa solicitud. Cuéntame qué PC quieres armar y con gusto te asesoro.");
    }

    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: contenidoParaHistorial(message.content) });
      continue;
    }

    if (toolUses.length === 0) {
      if (message.stop_reason === "max_tokens") {
        emit({ type: "text", text: "\n\n_(La respuesta se cortó por longitud. Escribe “continúa” para seguir.)_" });
      }
      emit({ type: "done" });
      return;
    }

    if (message.stop_reason === "max_tokens") {
      // El input de la herramienta pudo quedar truncado: no se ejecuta.
      throw new ChatError("La respuesta fue demasiado larga. Intenta con una pregunta más concreta.");
    }

    for (const t of toolUses) emit({ type: "status", message: describirHerramienta(t.name, t.input) });

    messages.push({ role: "assistant", content: contenidoParaHistorial(message.content) });
    // Todos los resultados van en un único mensaje de usuario.
    messages.push({ role: "user", content: toolUses.map(ejecutarHerramienta) });
  }

  throw new ChatError("No logré terminar la cotización. Intenta reformular tu pedido.");
}

/** Traduce errores a mensajes amigables para la UI (sin filtrar detalles internos). */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ChatError) return err.message;
  if (err instanceof Anthropic.RateLimitError) {
    return "Estamos recibiendo muchas consultas en este momento. Intenta de nuevo en un minuto.";
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return "El cotizador no está disponible en este momento. Escríbenos por WhatsApp y te ayudamos.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "No pudimos conectar con el asistente. Revisa tu conexión e intenta de nuevo.";
  }
  if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500) {
    return "El asistente está muy ocupado ahora mismo. Intenta de nuevo en unos segundos.";
  }
  return "Ocurrió un error inesperado con el asistente. Intenta de nuevo o escríbenos por WhatsApp.";
}
