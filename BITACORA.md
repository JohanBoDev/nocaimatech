# Bitácora de desarrollo — NocaimaTech

> **Para retomar en un chat nuevo:** pídele al asistente que lea este archivo
> (`BITACORA.md`) y el `README.md` antes de hacer cambios. Aquí está el estado
> actual, las decisiones tomadas y lo que falta. Actualiza esta bitácora al
> terminar cada bloque de trabajo.

## Contexto del proyecto

- **Qué es:** primera versión pública de nocaimatech.lat — landing + demo beta
  del cotizador de PC con IA. Startup colombiana (componentes de PC + desarrollo
  web asistido por IA). Todo en español de Colombia. Honestidad: lo que no
  existe aún se marca "Próximamente" o "Beta".
- **Rama de trabajo:** `claude/jolly-bardeen-qq3sgc`
- **Contacto:** johan@nocaimatech.lat · WhatsApp en `VITE_WHATSAPP`.

## Estado por fases

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Monorepo + backend Express/TS + catálogo JSON + Prisma (Waitlist) | ✅ Hecha |
| 2 | `POST /api/chat` con tool use (Claude) y streaming SSE | ✅ Hecha |
| 3 | Frontend: landing, lista de espera, cotizador `/cotizador` | ✅ Hecha |
| 4 | Despliegue en AWS (EC2 y RDS de Atlas + Amplify) | 🔄 En curso: falta Caddy, DNS de Amplify y API key |

## Decisiones técnicas

- **Monorepo con npm workspaces** (`backend`, `frontend`). Scripts raíz:
  `dev` (ambos con concurrently), `build`, `start`, `prisma:migrate`.
- **Backend ESM** (`"type": "module"`, `NodeNext`): los imports internos
  llevan extensión `.js`.
- **Prisma fijado en 6.19.x** (v7/v8 cambiaron configuración y exigen driver
  adapters). `prisma` está en `dependencies` (no dev) para que
  `postinstall: prisma generate` funcione en Elastic Beanstalk.
- **Tabla única `Waitlist`** (id autoincrement, nombre, email único, interes
  enum `COMPONENTES|WEB|AMBOS`, createdAt). Duplicado → HTTP 409 (Prisma P2002).
- **Catálogo** en `backend/data/catalog.json` (26 productos, gama baja/media/alta),
  validado con zod al arrancar (`src/catalog.ts`). Se carga con
  `new URL("../data/catalog.json", import.meta.url)` → funciona desde `src/` y `dist/`.
- **Compatibilidad** (`verificarCompatibilidad`): socket CPU↔board, RAM↔board,
  formato board↔chasis, disipador↔socket/TDP, CPU sin gráficos sin GPU, fuente ≥
  (suma TDP + 50 W base) × 1.3, stock 0, componentes faltantes.
- **Variables de entorno** validadas en `src/env.ts`. `ANTHROPIC_API_KEY` es
  opcional al arrancar (la landing y la lista de espera funcionan sin ella).
  `FRONTEND_URL` admite varios orígenes separados por coma.
- **Rate limit** también en `/api/waitlist` (10 cada 15 min por IP).
  `trust proxy = 1` para IP real detrás del balanceador de EB.

- **Chat (`src/chat/`)**: bucle manual de tool use con `client.beta.messages.stream`
  (máx. 8 vueltas, `max_tokens` 8192). Herramientas en `tools.ts`
  (`buscar_productos`, `verificar_compatibilidad`) con `eager_input_streaming` y
  validación zod del input antes de ejecutar. System prompt en `prompt.ts`
  (texto estable, sin fechas, para no romper la caché).
- **Modelo**: `MODEL_CHAT` (por defecto `claude-opus-5-5`). `CHAT_EFFORT`
  (por defecto `low`) controla costo/profundidad. En Opus 5.5 el thinking es
  adaptativo siempre (no se envía `thinking`).
- **Fallback ante rechazos**: para Opus 5.5/5, Fable 5.1 y Sonnet 5.5 se envía
  `fallbacks: "default"` con beta `server-side-fallback-2026-07-01`. Si el
  `stop_reason` final es `refusal` → mensaje amigable.
- **Contrato SSE de `/api/chat`** (líneas `data: {json}`):
  `{type:"text",text}` · `{type:"status",message}` (p. ej. "Buscando
  procesadores…") · `{type:"done"}` · `{type:"error",message}`. Ping `: ping`
  cada 15 s. Errores previos al stream → JSON `{error}` con 400/429/503.
- **Validación `/api/chat`**: máx. 20 mensajes, usuario ≤ 1000 caracteres,
  asistente ≤ 8000, alternados, empieza y termina en usuario. Rate limit 20/15 min/IP.
- El historial vive solo en el navegador: se envían únicamente textos
  (sin bloques de thinking/tool), así no hay nada que "editar" entre turnos.
- La tabla final siempre termina en una fila **Total**: el frontend la usa
  para mostrar el botón "Continuar por WhatsApp".

### Frontend y diseño

- **Dirección visual (pedida por Johan):** landing al estilo de las de **Claude**
  (serif editorial + sans, grises cálidos, producto mostrado en grande, FAQ) y
  **OpenClaw** (fondo oscuro con cielo de puntos, un acento con personalidad).
  También se siguieron `anthropics/skills → frontend-design` y
  `vercel-labs/web-interface-guidelines`. **Todo está en `frontend/DESIGN.md`**;
  leerlo antes de tocar la UI. No usar el acento clay de Anthropic ni degradados
  violeta/cian (se descartó un primer intento "genérico" y luego uno tipo PCB verde).
- Fuentes: Newsreader (titulares, clase `.title`), Geist (cuerpo), Geist Mono (solo
  la URL del mock). Acento único ámbar `#E2A84B`.
- Botones compartidos en `components/ui.ts`. Placa animada `BoardCompat`
  (único movimiento, arranca con IntersectionObserver, respeta reduced-motion).
- Rutas: `/` (Landing), `/cotizador` (lazy), `*` (404). React Router 7.
- Cotizador: historial en estado de React; Enter envía; si falla, "Reintentar";
  límite de 20 mensajes con aviso; `beforeunload` si hay conversación;
  auto-scroll solo si la persona está al final.
- WhatsApp: `lib/cotizacion.ts` detecta la fila **Total** de la tabla y arma el
  resumen (viñetas + total) para `wa.me/<VITE_WHATSAPP>?text=…`. Si
  `VITE_WHATSAPP` está vacío, los botones de WhatsApp no se muestran.
- Vite redirige `/api` → `localhost:4000` en desarrollo.

### Despliegue

- `amplify.yml` (raíz, `appRoot: frontend`, `npm ci --prefix ..` por workspaces).
  Falta en consola: variables `VITE_API_URL`/`VITE_WHATSAPP` y regla SPA (ver README).
- Backend EB: `npm run bundle:eb -w backend` → `backend-eb.zip` (dist, data,
  prisma, Procfile, `.platform/hooks/predeploy/01_prisma_migrate.sh`).
  `prisma` va en dependencies para `postinstall: prisma generate`.

## Cómo verificar rápido

```bash
npm install
cd backend && cp .env.example .env   # ajustar DATABASE_URL
npx prisma migrate dev
npm run dev                           # http://localhost:4000/api/health
```

## Historial

- **2026-10-08 — Fase 1:** estructura monorepo, backend con catálogo, Prisma +
  migración `init`, endpoint `POST /api/waitlist`, `GET /api/health`.
  Verificado: build OK, 201 / 409 duplicado / 400 validación.

- **2026-10-08 — Fase 2:** `POST /api/chat` con tool use + SSE. Verificado
  contra un mock de la API (vía `ANTHROPIC_BASE_URL`): 3 vueltas con
  herramientas en paralelo, eventos status/text/done; errores 400 (1001
  caracteres, 21 mensajes, orden), 503 sin API key, 429 tras 20 peticiones,
  CORS solo para FRONTEND_URL, error amigable si la API no responde.
  ⚠️ Aún no probado con una API key real.

- **2026-10-08 — Fase 3:** landing completa + cotizador + lista de espera.
  Johan pidió a mitad de fase un diseño no genérico, al estilo de las landings
  de Claude/OpenClaw → rediseño completo (ver `frontend/DESIGN.md`). Verificado
  con Playwright (escritorio 1440 px y móvil 390 px, sin errores de consola):
  flujo de chat completo contra el mock → tabla → botón WhatsApp con resumen
  correcto. `npm run build` y `npm run dev` de la raíz OK. README con despliegue.

- **2026-10-08 — Fase 4 (en curso):** se descartó Elastic Beanstalk; la API
  corre en Docker en la EC2 de Atlas (`i-092ae07ad496c27c1`, IP `98.91.152.171`),
  en `~/nocaimatech`, contenedor `nocaimatech-api` (tope 256 MB, ~50 MB en uso)
  unido a la red `atlas-backend_atlas`. Acceso por SSM (script de comandos, como Atlas).
  BD `nocaimatech_prod` en la RDS `atlas-db`, usuario `nocaima` (sin CONNECT a
  `atlas_prod`); snapshot previo `atlas-db-antes-nocaimatech-2026-10-08`.
  TLS a RDS: Prisma 6 lee **un solo** certificado del PEM → el Dockerfile extrae
  la raíz `RSA2048 G1` de us-east-1 (`sslcert` + `sslaccept=strict`). Migración OK.
  Frontend en Amplify `d2tnmbh87gxu60` (zip manual, regla SPA), dominio asociado
  y esperando DNS. `ANTHROPIC_API_KEY` vacía a propósito (chat → 503 amable).
  **Falta:** (1) Caddy de Atlas: `git pull` en `~/atlas-backend` (commit 8f9479c),
  copiar `deploy/caddy/nocaimatech.caddy` a `~/caddy-sites/` y
  `docker compose -f docker-compose.prod.yml up -d --no-deps caddy`;
  (2) registros en Namecheap (ALIAS @ y CNAME www → `d3vavwwple59h8.cloudfront.net`
  + CNAME de validación ACM); (3) poner la API key y `docker compose up -d`.

## Pendientes / ideas futuras

- [ ] Probar el cotizador con una `ANTHROPIC_API_KEY` real y ajustar el system
      prompt según las respuestas (`backend/src/chat/prompt.ts`).
- [ ] Desplegar: BD (Neon/Supabase o RDS), backend en EB, frontend en Amplify,
      dominio `nocaimatech.lat` + `api.nocaimatech.lat`.
- [ ] Revisar precios/stock reales del catálogo antes del lanzamiento.
- [ ] `npm audit`: 3 alertas *high* en `deepmerge-ts` (dependencia interna del
      CLI de Prisma 6, no expuesta a usuarios). Revisar al subir de versión de Prisma.
- [ ] Ideas: imagen OG para redes, analítica respetuosa (Plausible/Umami),
      panel simple para ver la lista de espera, tests (vitest) de
      `verificarCompatibilidad` y `resumenParaWhatsApp`.
