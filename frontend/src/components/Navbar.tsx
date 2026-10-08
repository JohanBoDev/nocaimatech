import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { IconClose, IconMenu } from "./icons";
import { btnPrimario } from "./ui";

const enlaces = [
  { href: "#como-funciona", label: "Cotizador" },
  { href: "#desarrollo-web", label: "Páginas web" },
  { href: "#lista-espera", label: "Lista de espera" },
  { href: "#preguntas", label: "Preguntas" },
  { href: "#contacto", label: "Contacto" },
];

export function Navbar() {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur-md">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-7 text-[0.95rem] text-ink-dim lg:flex">
          {enlaces.map((e) => (
            <li key={e.href}>
              <a href={e.href} className="transition-colors hover:text-ink">
                {e.label}
              </a>
            </li>
          ))}
        </ul>
        <Link to="/cotizador" className={`${btnPrimario} py-2 text-sm max-lg:hidden`}>
          Probar el cotizador
        </Link>
        <button
          type="button"
          className="-mr-2 grid h-11 w-11 place-items-center rounded-lg text-ink lg:hidden"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        >
          {abierto ? <IconClose className="h-6 w-6" /> : <IconMenu className="h-6 w-6" />}
        </button>
      </nav>
      {abierto && (
        <div id="menu-movil" className="border-t border-line/60 px-4 pb-5 lg:hidden">
          <ul className="py-2">
            {enlaces.map((e) => (
              <li key={e.href}>
                <a href={e.href} onClick={() => setAbierto(false)} className="block py-3 text-lg text-ink">
                  {e.label}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/cotizador" className={`${btnPrimario} w-full`}>
            Probar el cotizador (beta)
          </Link>
        </div>
      )}
    </header>
  );
}
