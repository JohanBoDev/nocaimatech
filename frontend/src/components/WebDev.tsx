import { pill, btnSecundario } from "./ui";

const flujo = [
  { titulo: "Describes tu negocio", texto: "Qué vendes, a quién y qué quieres que la gente haga en tu página." },
  { titulo: "La IA genera un primer borrador", texto: "Estructura, textos y diseño inicial a partir de tu descripción." },
  { titulo: "Un desarrollador lo termina", texto: "Una persona revisa, ajusta y publica tu sitio." },
];

export function WebDev() {
  return (
    <section id="desarrollo-web" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-line bg-surface px-6 py-10 sm:px-12 sm:py-14">
          <span className={`${pill} border-accent/40 text-accent`}>Próximamente</span>
          <div className="mt-6 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="title text-[clamp(2.2rem,5vw,3.4rem)]">Desarrollo web con IA</h2>
              <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-ink-dim">
                Para emprendedores y negocios que necesitan estar en internet sin esperar meses: describes tu negocio, la
                IA genera un primer borrador y un desarrollador lo termina. Todavía no está disponible.
              </p>
              <a href="#lista-espera" className={`${btnSecundario} mt-8`}>
                Avisarme cuando esté listo
              </a>
            </div>
            <ol className="space-y-7 self-center lg:border-l lg:border-line lg:pl-12">
              {flujo.map((f, i) => (
                <li key={f.titulo} className="flex gap-5">
                  <span className="title tnum w-5 shrink-0 text-2xl text-accent">{i + 1}</span>
                  <div>
                    <h3 className="font-medium">{f.titulo}</h3>
                    <p className="mt-1 text-ink-dim">{f.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
