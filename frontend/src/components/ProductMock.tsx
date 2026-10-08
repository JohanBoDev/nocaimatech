import { IconWhatsApp } from "./icons";

const filas = [
  ["Procesador", "AMD Ryzen 5 7600", "$869.000"],
  ["Board", "Gigabyte B650M Gaming X AX", "$789.000"],
  ["Memoria", "Corsair Vengeance 32 GB DDR5", "$699.000"],
  ["Video", "NVIDIA GeForce RTX 4060 8 GB", "$1.399.000"],
  ["Almacenamiento", "Kingston NV3 1 TB", "$279.000"],
  ["Fuente", "Corsair CV550 550 W", "$269.000"],
  ["Chasis", "Thermaltake Versa H18", "$199.000"],
];

/** Vista del cotizador como "captura de producto". Ejemplo estático con precios del catálogo. */
export function ProductMock() {
  return (
    <figure>
      <div className="rounded-2xl border border-line bg-surface p-1.5 shadow-[0_1px_1px_rgb(0_0_0/0.3),0_24px_64px_-12px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-2 px-3 py-2.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="h-2.5 w-2.5 rounded-full bg-line" />
          <span className="ml-3 truncate font-mono text-xs text-ink-faint">nocaimatech.lat/cotizador</span>
        </div>
        <div className="space-y-5 rounded-xl bg-bg p-4 sm:p-7">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-surface-2 px-4 py-2.5 text-[0.95rem]">
            Tengo $4.500.000 para un PC gamer. Juego en 1080p, sobre todo Warzone y Fortnite.
          </p>
          <div className="text-[0.95rem] leading-relaxed text-ink">
            <p>¡Buen presupuesto para 1080p! Revisé socket, RAM y fuente: todo es compatible. Así te queda:</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-line">
              <table className="tnum w-full text-sm">
                <caption className="sr-only">Ejemplo de cotización</caption>
                <thead>
                  <tr className="border-b border-line text-left text-ink-dim">
                    <th scope="col" className="px-3 py-2.5 font-medium">Componente</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Producto</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map(([c, p, v]) => (
                    <tr key={c} className="border-b border-line/60">
                      <td className="px-3 py-2 whitespace-nowrap text-ink-dim">{c}</td>
                      <td className="px-3 py-2">{p}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">{v}</td>
                    </tr>
                  ))}
                  <tr className="bg-accent/10 font-semibold text-accent-hi">
                    <td className="px-3 py-2.5">Total</td>
                    <td />
                    <td className="px-3 py-2.5 text-right">$4.503.000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-ink-dim">Es una cotización preliminar: un asesor confirma precio y disponibilidad.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#1f3a2b] px-4 py-2.5 text-sm font-medium text-[#bfe8cf]" aria-hidden>
            <IconWhatsApp className="h-4 w-4" /> Continuar por WhatsApp
          </span>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-ink-faint">
        Ejemplo de una conversación con el cotizador. Los precios son del catálogo actual.
      </figcaption>
    </figure>
  );
}
