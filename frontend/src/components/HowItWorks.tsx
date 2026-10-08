import { Link } from "react-router-dom";
import { BoardCompat } from "./BoardCompat";
import { IconCheck } from "./icons";
import { btnPrimario } from "./ui";

const pasos = [
  {
    titulo: "Cuéntanos tu presupuesto y uso",
    texto: "Cuánto quieres invertir en pesos y para qué lo vas a usar: gaming, diseño, oficina o estudio.",
  },
  {
    titulo: "La IA arma la configuración y verifica compatibilidad",
    texto: "Elige componentes de nuestro catálogo y revisa que todo funcione junto antes de mostrártelo.",
  },
  {
    titulo: "Recibes tu cotización y continúas por WhatsApp",
    texto: "Ves el precio de cada componente y el total en COP. Un asesor confirma disponibilidad y precio final.",
  },
];

const revisiones = [
  "El socket del procesador coincide con la board",
  "La RAM es del tipo que acepta la board (DDR4 o DDR5)",
  "La fuente cubre el consumo estimado con 30 % de margen",
  "La board cabe en el chasis y el disipador aguanta el procesador",
  "Solo usa productos del catálogo con stock disponible",
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="title max-w-2xl text-[clamp(2.2rem,5vw,3.4rem)]">Cómo funciona el cotizador</h2>
        <p className="mt-4 max-w-xl text-lg text-ink-dim">
          Tres pasos. Sin formularios largos y sin tener que saber de hardware.
        </p>

        <ol className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-12">
          {pasos.map((p, i) => (
            <li key={p.titulo}>
              <span className="title tnum text-4xl text-accent">{i + 1}</span>
              <h3 className="mt-4 text-lg leading-snug font-medium">{p.titulo}</h3>
              <p className="mt-2 leading-relaxed text-ink-dim">{p.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-24 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="title text-[clamp(1.9rem,4vw,2.6rem)]">Antes de cotizar, revisa que todo encaje</h3>
            <ul className="mt-7 space-y-3.5">
              {revisiones.map((r) => (
                <li key={r} className="flex gap-3 text-ink-dim">
                  <IconCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Link to="/cotizador" className={`${btnPrimario} mt-9`}>
              Probar el cotizador (beta)
            </Link>
            <p className="mt-3 text-sm text-ink-faint">Es una demo: las cotizaciones son preliminares.</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 sm:p-7">
            <BoardCompat />
          </div>
        </div>
      </div>
    </section>
  );
}
