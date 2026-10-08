import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatApiError, enviarChat, type ChatMessage } from "../lib/api";
import { MAX_CARACTERES, MAX_MENSAJES, whatsappUrl } from "../lib/config";
import { esCotizacion, resumenParaWhatsApp } from "../lib/cotizacion";
import { IconArrowLeft, IconRefresh, IconSend, IconWhatsApp } from "../components/icons";
import { btnPrimario, btnSecundario, pill } from "../components/ui";

const sugerencias = [
  "Tengo $4.500.000 para un PC gamer, juego en 1080p",
  "Necesito un PC para oficina y estudio con $2.000.000",
  "Quiero editar video y hacer diseño, mi presupuesto es $7.000.000",
];

const markdown: Components = {
  table: ({ children }) => (
    <div className="cot">
      <table>{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

export default function Cotizador() {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [borrador, setBorrador] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = "Cotizador de PC con IA (beta) | NocaimaTech";
    return () => abortRef.current?.abort();
  }, []);

  // Advierte antes de salir si hay una conversación (no se guarda en ningún lado).
  useEffect(() => {
    if (mensajes.length === 0) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [mensajes.length]);

  // Sigue la respuesta mientras llega, salvo que la persona haya subido a leer algo anterior.
  const pegadoAbajo = useRef(true);
  useEffect(() => {
    const onScroll = () => {
      pegadoAbajo.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (pegadoAbajo.current) window.scrollTo({ top: document.documentElement.scrollHeight });
  }, [mensajes, borrador, estado, error]);

  const ejecutar = useCallback(async (historial: ChatMessage[]) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setEnviando(true);
    setError(null);
    setEstado(null);
    setBorrador("");
    let acumulado = "";

    try {
      await enviarChat(
        historial,
        (ev) => {
          if (ev.type === "text") {
            acumulado += ev.text;
            setBorrador(acumulado);
            setEstado(null);
          } else if (ev.type === "status") {
            setEstado(ev.message);
          }
        },
        controller.signal,
      );
      const respuesta = acumulado.trim();
      if (!respuesta) throw new ChatApiError("El asistente no respondió. Intenta de nuevo.");
      setMensajes([...historial, { role: "assistant", content: respuesta }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof ChatApiError ? err.message : "Algo salió mal. Intenta de nuevo en un momento.");
    } finally {
      if (!controller.signal.aborted) {
        setEnviando(false);
        setEstado(null);
        setBorrador("");
      }
    }
  }, []);

  // Si el último envío falló, la conversación termina en un mensaje del usuario: se reemplaza.
  const base = mensajes.at(-1)?.role === "user" ? mensajes.slice(0, -1) : mensajes;
  const limiteAlcanzado = base.length + 1 > MAX_MENSAJES;

  function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || enviando || limiteAlcanzado || limpio.length > MAX_CARACTERES) return;
    const historial: ChatMessage[] = [...base, { role: "user", content: limpio }];
    pegadoAbajo.current = true;
    setMensajes(historial);
    setTexto("");
    void ejecutar(historial);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    enviar(texto);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar(texto);
    }
  }

  function nuevaConversacion() {
    if (mensajes.length > 0 && !window.confirm("¿Borrar esta conversación y empezar de nuevo?")) return;
    abortRef.current?.abort();
    setMensajes([]);
    setBorrador("");
    setEnviando(false);
    setEstado(null);
    setError(null);
    setTexto("");
    inputRef.current?.focus();
  }

  const vacio = mensajes.length === 0 && !enviando;
  const restantes = MAX_CARACTERES - texto.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-ink-dim hover:text-ink">
            <IconArrowLeft className="h-4 w-4" /> <span translate="no">NocaimaTech</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-medium">Cotizador</h1>
            <span className={`${pill} border-accent/40 py-0.5 text-xs text-accent`}>Beta</span>
          </div>
          <button
            type="button"
            onClick={nuevaConversacion}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-dim hover:bg-surface hover:text-ink"
          >
            <IconRefresh className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva conversación</span>
            <span className="sr-only sm:hidden">Nueva conversación</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-6">
        {vacio ? (
          <div className="pt-[8vh] text-center">
            <h2 className="title text-[clamp(2.1rem,6vw,3rem)]">¿Qué PC quieres armar?</h2>
            <p className="mx-auto mt-4 max-w-md text-ink-dim">
              Dime tu presupuesto en pesos y para qué lo vas a usar. Te propongo una configuración compatible con
              productos de nuestro catálogo.
            </p>
            <ul className="mx-auto mt-9 flex max-w-xl flex-col gap-2.5">
              {sugerencias.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => enviar(s)}
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-left text-[0.95rem] text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ol className="space-y-7" aria-label="Conversación">
            {mensajes.map((m, i) => (
              <li key={i}>{m.role === "user" ? <MensajeUsuario texto={m.content} /> : <MensajeAsesor texto={m.content} />}</li>
            ))}
            {enviando && (
              <li>
                {borrador ? <MensajeAsesor texto={borrador} enCurso /> : null}
                <div aria-live="polite" className="mt-3 flex items-center gap-2.5 text-sm text-ink-dim">
                  {(estado || !borrador) && (
                    <>
                      <span className="flex gap-1" aria-hidden>
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                      {estado ?? "Pensando…"}
                    </>
                  )}
                </div>
              </li>
            )}
            {error && (
              <li role="alert" className="rounded-xl border border-fault/40 bg-fault/5 p-4">
                <p className="text-ink">{error}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void ejecutar(mensajes)} className={`${btnSecundario} py-2 text-sm`}>
                    <IconRefresh className="h-4 w-4" /> Reintentar
                  </button>
                  <WhatsAppLink texto="¡Hola NocaimaTech! Quiero cotizar un PC." etiqueta="Escribir por WhatsApp" />
                </div>
              </li>
            )}
          </ol>
        )}
      </main>

      <div className="sticky bottom-0 bg-gradient-to-t from-bg from-70% to-transparent pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl px-4">
          {limiteAlcanzado ? (
            <div className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-ink-dim">
                Llegaste al límite de {MAX_MENSAJES} mensajes de esta demo. Continúa por WhatsApp o empieza otra
                conversación.
              </p>
              <button type="button" onClick={nuevaConversacion} className={`${btnPrimario} mt-3 py-2 text-sm`}>
                Nueva conversación
              </button>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-line bg-surface p-2 transition-colors focus-within:border-ink-faint"
            >
              <label htmlFor="mensaje" className="sr-only">
                Escribe tu mensaje
              </label>
              <textarea
                id="mensaje"
                ref={inputRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={MAX_CARACTERES}
                placeholder="Ej.: tengo $3.000.000 para un PC de diseño…"
                className="block max-h-48 w-full resize-none bg-transparent px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:outline-none field-sizing-content"
              />
              <div className="flex items-center justify-between gap-3 px-2 pt-1">
                <p className={`tnum text-xs ${restantes < 100 ? "text-accent" : "text-ink-faint"}`} aria-live="polite">
                  {restantes < 100 ? `Quedan ${restantes} caracteres` : "Enter para enviar, Shift + Enter para nueva línea"}
                </p>
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  aria-label={enviando ? "Respondiendo…" : "Enviar mensaje"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-bg transition-colors hover:bg-accent-hi disabled:bg-surface-2 disabled:text-ink-faint"
                >
                  <IconSend className="h-[18px] w-[18px]" />
                </button>
              </div>
            </form>
          )}
          <p className="mt-2 text-center text-xs text-ink-faint">
            Demo beta: cotizaciones preliminares. No guardamos tus conversaciones.
          </p>
        </div>
      </div>
    </div>
  );
}

function MensajeUsuario({ texto }: { texto: string }) {
  return (
    <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 whitespace-pre-wrap">
      {texto}
    </div>
  );
}

function MensajeAsesor({ texto, enCurso = false }: { texto: string; enCurso?: boolean }) {
  const cotizacion = !enCurso && esCotizacion(texto);
  return (
    <div>
      <div className="chat-md text-[0.975rem] text-ink">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdown}>
          {texto}
        </ReactMarkdown>
      </div>
      {cotizacion && (
        <div className="mt-4">
          <WhatsAppLink texto={resumenParaWhatsApp(texto)} etiqueta="Continuar por WhatsApp" destacado />
        </div>
      )}
    </div>
  );
}

function WhatsAppLink({ texto, etiqueta, destacado = false }: { texto: string; etiqueta: string; destacado?: boolean }) {
  const url = whatsappUrl(texto);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        destacado
          ? "inline-flex items-center gap-2 rounded-xl bg-[#1f3a2b] px-4 py-2.5 font-medium text-[#bfe8cf] transition-colors hover:bg-[#25462f]"
          : `${btnSecundario} py-2 text-sm`
      }
    >
      <IconWhatsApp className="h-4 w-4" /> {etiqueta}
    </a>
  );
}
