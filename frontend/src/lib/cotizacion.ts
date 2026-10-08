/** Detecta la tabla de cotización final (última fila "Total") en una respuesta del asesor. */
export function esCotizacion(texto: string): boolean {
  return /^\s*\|\s*\**\s*total\b/im.test(texto);
}

/** Convierte la tabla Markdown en un resumen de texto plano para WhatsApp. */
export function resumenParaWhatsApp(texto: string): string {
  const filas = texto
    .split("\n")
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((c) => c.replace(/\*\*/g, "").trim()),
    )
    .filter((celdas) => !celdas.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));

  const [, ...cuerpo] = filas; // la primera fila es el encabezado
  const lineas = cuerpo.map((celdas) => {
    const [componente, producto, precio] = celdas;
    if (/^total$/i.test(componente ?? "")) return `\n*Total: ${precio || producto}*`;
    return `• ${componente}: ${producto} — ${precio}`;
  });

  return [
    "¡Hola NocaimaTech! 👋 Armé esta cotización preliminar con el asesor IA de nocaimatech.lat y quiero continuar:",
    "",
    ...lineas,
    "",
    "¿Me confirman disponibilidad y precio final?",
  ].join("\n");
}
