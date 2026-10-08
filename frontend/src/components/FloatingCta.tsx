import { Link } from "react-router-dom";
import { IconChat } from "./icons";

/** Acceso directo al cotizador, siempre visible en la landing. */
export function FloatingCta() {
  return (
    <Link
      to="/cotizador"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex items-center gap-2 rounded-full bg-accent py-3 pr-5 pl-4 font-medium text-bg shadow-[0_1px_2px_rgb(0_0_0/0.4),0_10px_30px_-4px_rgb(0_0_0/0.6)] transition-colors hover:bg-accent-hi sm:right-6"
    >
      <IconChat className="h-5 w-5" />
      Cotizar mi PC
      <span className="rounded-full bg-bg/15 px-2 py-0.5 text-xs font-semibold">Beta</span>
    </Link>
  );
}
