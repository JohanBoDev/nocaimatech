import { Link } from "react-router-dom";
import { EMAIL } from "../lib/config";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line/60 pb-28 sm:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-dim">
            Componentes de PC y desarrollo web asistido por IA. Startup colombiana.
          </p>
        </div>
        <nav aria-label="Producto" className="text-sm">
          <h2 className="font-medium text-ink">Producto</h2>
          <ul className="mt-3 space-y-2.5 text-ink-dim">
            <li><Link to="/cotizador" className="hover:text-ink">Cotizador (beta)</Link></li>
            <li><a href="/#desarrollo-web" className="hover:text-ink">Páginas web (próximamente)</a></li>
            <li><a href="/#lista-espera" className="hover:text-ink">Lista de espera</a></li>
          </ul>
        </nav>
        <nav aria-label="Contacto" className="text-sm">
          <h2 className="font-medium text-ink">Contacto</h2>
          <ul className="mt-3 space-y-2.5 text-ink-dim">
            <li><a href={`mailto:${EMAIL}`} className="hover:text-ink" translate="no">{EMAIL}</a></li>
            <li><a href="/#preguntas" className="hover:text-ink">Preguntas frecuentes</a></li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl px-4 text-sm text-ink-faint sm:px-6">
        © {new Date().getFullYear()} <span translate="no">NocaimaTech</span>. Hecho en Colombia.
      </p>
    </footer>
  );
}
