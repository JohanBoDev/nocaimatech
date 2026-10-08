import { useRef, useState, type FormEvent } from "react";
import { unirseListaEspera, type Interes } from "../lib/api";
import { btnPrimario } from "./ui";

type Errores = Partial<Record<"nombre" | "email" | "interes", string>>;

const opciones: { value: Interes; label: string }[] = [
  { value: "COMPONENTES", label: "Componentes de PC" },
  { value: "WEB", label: "Página web" },
  { value: "AMBOS", label: "Ambos" },
];

const campo =
  "mt-2 block w-full rounded-xl border border-line bg-bg px-4 py-3 text-base text-ink placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:outline-none aria-[invalid=true]:border-fault";

export function Waitlist() {
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "info" | "error"; texto: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const datos = {
      nombre: String(fd.get("nombre") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      interes: String(fd.get("interes") ?? "") as Interes,
    };

    const nuevos: Errores = {};
    if (datos.nombre.length < 2) nuevos.nombre = "Escribe tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) nuevos.email = "Escribe un correo válido, por ejemplo ana@gmail.com.";
    if (!opciones.some((o) => o.value === datos.interes)) nuevos.interes = "Elige qué te interesa.";
    setErrores(nuevos);
    setMensaje(null);
    const primero = Object.keys(nuevos)[0];
    if (primero) {
      formRef.current?.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      return;
    }

    setEstado("enviando");
    const r = await unirseListaEspera(datos);
    if (r.ok) {
      setEstado("ok");
      setMensaje({ tipo: "ok", texto: r.mensaje });
    } else {
      setEstado("idle");
      setMensaje({ tipo: r.duplicado ? "info" : "error", texto: r.mensaje });
    }
  }

  return (
    <section id="lista-espera" className="border-t border-line/60 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="title text-[clamp(2.2rem,5vw,3.4rem)]">Lista de espera</h2>
          <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-ink-dim">
            Estamos preparando la tienda de componentes y el servicio de páginas web. Déjanos tus datos y te escribimos
            cuando abramos. Solo eso, sin publicidad.
          </p>
        </div>

        <div aria-live="polite">
          {estado === "ok" ? (
            <div className="rounded-xl border border-ok/40 bg-surface p-6">
              <p className="flex items-center gap-2 text-lg font-semibold text-ink">
                <span className="h-2.5 w-2.5 rounded-full bg-ok" aria-hidden /> Quedaste en la lista
              </p>
              <p className="mt-2 text-ink-dim">{mensaje?.texto}</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-7">
              <div>
                <label htmlFor="wl-nombre" className="font-medium">Nombre</label>
                <input
                  id="wl-nombre"
                  name="nombre"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="Ana María…"
                  aria-invalid={!!errores.nombre}
                  aria-describedby={errores.nombre ? "wl-nombre-error" : undefined}
                  className={campo}
                />
                {errores.nombre && <p id="wl-nombre-error" className="mt-1.5 text-sm text-fault">{errores.nombre}</p>}
              </div>
              <div>
                <label htmlFor="wl-email" className="font-medium">Correo</label>
                <input
                  id="wl-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  maxLength={254}
                  placeholder="ana@gmail.com…"
                  aria-invalid={!!errores.email}
                  aria-describedby={errores.email ? "wl-email-error" : undefined}
                  className={campo}
                />
                {errores.email && <p id="wl-email-error" className="mt-1.5 text-sm text-fault">{errores.email}</p>}
              </div>
              <div>
                <label htmlFor="wl-interes" className="font-medium">¿Qué te interesa?</label>
                <select
                  id="wl-interes"
                  name="interes"
                  defaultValue=""
                  aria-invalid={!!errores.interes}
                  aria-describedby={errores.interes ? "wl-interes-error" : undefined}
                  className={`${campo} appearance-auto bg-bg text-ink`}
                >
                  <option value="" disabled>Elige una opción</option>
                  {opciones.map((o) => (
                    <option key={o.value} value={o.value} className="bg-bg text-ink">{o.label}</option>
                  ))}
                </select>
                {errores.interes && <p id="wl-interes-error" className="mt-1.5 text-sm text-fault">{errores.interes}</p>}
              </div>

              {mensaje && (
                <p className={`text-sm ${mensaje.tipo === "error" ? "text-fault" : "text-accent"}`}>{mensaje.texto}</p>
              )}

              <button
                type="submit"
                disabled={estado === "enviando"}
                className={`${btnPrimario} w-full`}
              >
                {estado === "enviando" ? "Guardando…" : "Unirme a la lista de espera"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
