import { useEffect } from "react";
import { Link } from "react-router-dom";
import { btnPrimario } from "../components/ui";

export default function NotFound() {
  useEffect(() => {
    document.title = "Página no encontrada | NocaimaTech";
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="title text-5xl">Esta página no existe</h1>
        <p className="mt-4 text-ink-dim">Revisa la dirección o vuelve al inicio.</p>
        <Link to="/" className={`${btnPrimario} mt-8`}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
