import { API_URL } from "./config";

export type Interes = "COMPONENTES" | "WEB" | "AMBOS";

export async function unirseListaEspera(datos: { nombre: string; email: string; interes: Interes }) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  } catch {
    return { ok: false as const, duplicado: false, mensaje: "No pudimos conectar con el servidor. Revisa tu conexión." };
  }
  const body = (await res.json().catch(() => ({}))) as { mensaje?: string; error?: string };
  if (res.ok) return { ok: true as const, mensaje: body.mensaje ?? "¡Listo! Te avisaremos apenas lancemos." };
  return {
    ok: false as const,
    duplicado: res.status === 409,
    mensaje: body.error ?? "No pudimos guardar tu registro. Intenta de nuevo.",
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "status"; message: string }
  | { type: "done" }
  | { type: "error"; message: string };

export class ChatApiError extends Error {}

/** Envía la conversación y procesa la respuesta en streaming (SSE sobre POST). */
export async function enviarChat(
  messages: ChatMessage[],
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new ChatApiError("No pudimos conectar con el asistente. Revisa tu conexión e intenta de nuevo.");
  }

  if (!res.ok || !res.body) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ChatApiError(body.error ?? "El asistente no respondió. Intenta de nuevo en un momento.");
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let terminado = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let corte: number;
    while ((corte = buffer.indexOf("\n\n")) !== -1) {
      const bloque = buffer.slice(0, corte);
      buffer = buffer.slice(corte + 2);
      for (const linea of bloque.split("\n")) {
        if (!linea.startsWith("data:")) continue; // ignora comentarios ": ping"
        const event = JSON.parse(linea.slice(5).trim()) as ChatEvent;
        if (event.type === "error") throw new ChatApiError(event.message);
        if (event.type === "done") terminado = true;
        onEvent(event);
      }
    }
  }

  if (!terminado) throw new ChatApiError("La respuesta se interrumpió. Intenta de nuevo.");
}
