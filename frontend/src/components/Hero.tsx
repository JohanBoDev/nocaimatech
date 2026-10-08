import { Link } from "react-router-dom";
import { ProductMock } from "./ProductMock";
import { btnPrimario, btnSecundario, pill } from "./ui";

export function Hero() {
  return (
    <section className="stars relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 pt-14 pb-20 text-center sm:px-6 md:pt-24">
        <Link to="/cotizador" className={`${pill} border-line bg-surface text-ink-dim transition-colors hover:text-ink`}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          El cotizador con IA ya está en beta
        </Link>
        <h1 className="title mx-auto mt-7 max-w-4xl text-[clamp(2.75rem,8vw,5.25rem)] text-ink">
          Arma tu PC ideal con ayuda de IA
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-dim sm:text-xl">
          Cuéntale al asesor tu presupuesto y para qué vas a usar el equipo, y recibe una configuración compatible con
          precios en pesos. Muy pronto también creamos la página web de tu negocio con IA.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/cotizador" className={btnPrimario}>
            Probar el cotizador (beta)
          </Link>
          <a href="#lista-espera" className={btnSecundario}>
            Unirme a la lista de espera
          </a>
        </div>
        <div className="mx-auto mt-16 max-w-4xl text-left">
          <ProductMock />
        </div>
      </div>
    </section>
  );
}
