export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const WHATSAPP = (import.meta.env.VITE_WHATSAPP ?? "").replace(/\D/g, "");
export const EMAIL = "johan@nocaimatech.lat";

/** Debe coincidir con los límites del backend (routes/chat.ts). */
export const MAX_CARACTERES = 1000;
export const MAX_MENSAJES = 20;

export function whatsappUrl(texto?: string): string | null {
  if (!WHATSAPP) return null;
  const base = `https://wa.me/${WHATSAPP}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
