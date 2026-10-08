# Sistema de diseño — NocaimaTech

## Referencias

- **Landings de Claude (claude.com)**: estructura editorial: titulares en serif,
  cuerpo en sans, grises cálidos, mucho aire, el producto mostrado como
  "captura", bloques alternos texto/visual, FAQ y footer con columnas.
- **OpenClaw (openclaw.ai)**: fondo casi negro con cielo de puntos y un acento
  único con personalidad.
- **anthropics/skills → `skills/frontend-design`**: evitar rasgos de página
  genérica (degradados violeta, tarjetas idénticas, etiquetas en MAYÚSCULAS, "→"
  en botones, animaciones en cada sección). Un solo elemento audaz.
- **vercel-labs/web-interface-guidelines**: accesibilidad, foco, formularios,
  movimiento y copy.

No copiamos la identidad de Anthropic: no usamos su acento *clay* (#D97757) ni
sus fuentes. El acento propio es ámbar "panela".

## Tokens (`src/index.css` → `@theme`)

| Token | Hex | Uso |
|---|---|---|
| `bg` | `#131211` | Fondo (gris cálido muy oscuro) |
| `surface` | `#1C1B19` | Paneles, formularios, mock de producto |
| `surface-2` | `#252420` | Burbujas del usuario, estados elevados |
| `line` | `#33312C` | Bordes y divisores |
| `ink` | `#F0EEE6` | Texto principal; botón primario |
| `ink-dim` / `ink-faint` | `#A5A297` / `#75726A` | Texto secundario / terciario |
| `accent` | `#E2A84B` | Acento único: números, "Beta", CTA flotante, enviar |
| `ok` / `fault` | `#86C19F` / `#E8806F` | Estados (siempre acompañados de texto) |

## Tipografía

- **Newsreader** (serif, clase `.title`): titulares, peso 450, interlineado 1.04.
- **Geist** (sans): cuerpo e interfaz. **Geist Mono** solo para la URL del mock.
- Cifras con `tabular-nums` (`.tnum`).

## Componentes y reglas

- Botones (`components/ui.ts`): primario claro (`bg-ink`), secundario con borde,
  acento solo para el CTA flotante y el botón de enviar. Radio 12 px; paneles 16–24 px.
- Hero centrado con píldora de anuncio + mock del cotizador (`ProductMock`).
- Único momento animado: la placa (`BoardCompat`) se enruta al entrar en pantalla.
  Respeta `prefers-reduced-motion`.
- "Próximamente" = píldora con borde ámbar; nunca mostrar como disponible algo que no existe.
- Texto en *sentence case*, voz activa, estados de carga con "…".
- Foco visible, inputs ≥ 16 px, `aria-live` en chat y formulario, skip link,
  `color-scheme: dark`, safe areas en elementos fijos.
