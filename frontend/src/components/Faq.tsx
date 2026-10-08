const preguntas = [
  {
    q: "¿Los precios del cotizador son reales?",
    a: "Son precios de referencia de nuestro catálogo en pesos colombianos, con IVA incluido. La cotización es preliminar: un asesor confirma precio y disponibilidad por WhatsApp antes de cualquier compra.",
  },
  {
    q: "¿Puedo comprar ya?",
    a: "Todavía no tenemos tienda en línea. Si te gusta una cotización, continúa por WhatsApp y te ayudamos directamente. Únete a la lista de espera para enterarte cuando abramos.",
  },
  {
    q: "¿Guardan mis conversaciones con el asesor?",
    a: "No. La conversación vive solo en tu navegador y se borra al cerrar la página. Solo guardamos tu nombre, correo e interés si te unes a la lista de espera.",
  },
  {
    q: "¿La IA se puede equivocar?",
    a: "Puede pasar, por eso está en beta. Solo recomienda productos del catálogo y una herramienta revisa la compatibilidad de cada configuración, pero un asesor humano siempre valida la cotización final.",
  },
  {
    q: "¿Cuándo estará el servicio de páginas web?",
    a: "Estamos trabajando en él. Elige “Página web” o “Ambos” en la lista de espera y te avisamos primero.",
  },
];

export function Faq() {
  return (
    <section id="preguntas" className="border-t border-line/60 py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <h2 className="title text-[clamp(2.2rem,5vw,3.4rem)]">Preguntas frecuentes</h2>
        <div className="divide-y divide-line border-y border-line">
          {preguntas.map((p) => (
            <details key={p.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {p.q}
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-dim transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[60ch] pb-5 leading-relaxed text-ink-dim">{p.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
