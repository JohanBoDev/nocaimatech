import { useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { WebDev } from "../components/WebDev";
import { Waitlist } from "../components/Waitlist";
import { Faq } from "../components/Faq";
import { Contact } from "../components/Contact";
import { Footer } from "../components/Footer";
import { FloatingCta } from "../components/FloatingCta";

export default function Landing() {
  useEffect(() => {
    document.title = "NocaimaTech | Arma tu PC ideal con ayuda de IA";
  }, []);

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-bg">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Hero />
        <HowItWorks />
        <WebDev />
        <Waitlist />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
