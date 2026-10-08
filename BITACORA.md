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
| 2 | `POST /api/chat` con tool use (Claude) y streaming SSE | ⏳ Pendiente |
| 3 | Frontend: landing, lista de espera, cotizador `/cotizador` | ⏳ Pendiente |

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

## Pendientes / ideas futuras

- (Fase 2 y 3 en curso)
