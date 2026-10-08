import { EMAIL, whatsappUrl } from "../lib/config";
import { IconMail, IconWhatsApp } from "./icons";
import { btnPrimario, btnSecundario } from "./ui";

export function Contact() {
  const wa = whatsappUrl("¡Hola NocaimaTech! Vengo de nocaimatech.lat y tengo una pregunta.");
  return (
    <section id="contacto" className="border-t border-line/60 py-24">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 className="title text-[clamp(2.2rem,5vw,3.4rem)]">¿Prefieres hablar con una persona?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-dim">
          Escríbenos si tienes dudas sobre una cotización o quieres algo a la medida.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={btnPrimario}>
              <IconWhatsApp className="h-5 w-5" /> Escribir por WhatsApp
            </a>
          )}
          <a href={`mailto:${EMAIL}`} className={btnSecundario}>
            <IconMail className="h-5 w-5" /> <span translate="no">{EMAIL}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
