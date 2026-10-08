# NocaimaTech — nocaimatech.lat

Primera versión pública de NocaimaTech, una startup colombiana de componentes de PC y
desarrollo web asistido por IA. Incluye:

- **Landing** (una página): hero, cómo funciona el cotizador, desarrollo web con IA
  (próximamente), lista de espera, preguntas frecuentes y contacto.
- **Cotizador con IA (beta)** en `/cotizador`: chat con Claude que arma un PC con
  productos del catálogo, verifica compatibilidad y entrega una cotización en COP
  que se continúa por WhatsApp.

> ¿Retomas el proyecto en otro chat? Lee primero [`BITACORA.md`](./BITACORA.md).
> Las reglas visuales están en [`frontend/DESIGN.md`](./frontend/DESIGN.md).

## Stack

| Parte | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS 4 + React Router 7 |
| Backend | Node.js + Express 5 + TypeScript (ESM) |
| IA | `@anthropic-ai/sdk` (tool use + streaming SSE) |
| Base de datos | PostgreSQL + Prisma 6 (solo tabla `Waitlist`) |
| Catálogo | `backend/data/catalog.json` (26 productos, sin base de datos) |

```
nocaimatech/
├── backend/
│   ├── data/catalog.json        # catálogo de productos
│   ├── prisma/                  # schema + migraciones (Waitlist)
│   └── src/
│       ├── catalog.ts           # carga, búsqueda y verificación de compatibilidad
│       ├── chat/                # system prompt, herramientas y bucle de Claude
│       └── routes/              # /api/chat (SSE) y /api/waitlist
├── frontend/
│   └── src/
│       ├── components/          # secciones de la landing
│       ├── pages/               # Landing, Cotizador, 404
│       └── lib/                 # cliente de API/SSE, config, resumen WhatsApp
├── BITACORA.md                  # estado del proyecto y decisiones
└── amplify.yml                  # build del frontend en AWS Amplify
```

## Correr en local

Requisitos: **Node.js 22** (mínimo 20.19) y **PostgreSQL** (local o en Docker).

```bash
# 1. Dependencias (npm workspaces: instala backend y frontend)
npm install

# 2. Base de datos (si no tienes Postgres, con Docker):
docker run -d --name nocaimatech-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nocaimatech -p 5432:5432 postgres:16

# 3. Variables de entorno
cp backend/.env.example backend/.env      # pon tu ANTHROPIC_API_KEY y DATABASE_URL
cp frontend/.env.example frontend/.env    # pon tu número en VITE_WHATSAPP

# 4. Migraciones
npm run prisma:migrate

# 5. Arrancar backend (:4000) y frontend (:5173) a la vez
npm run dev
```

Abre http://localhost:5173. En desarrollo Vite redirige `/api` al backend, así que
`VITE_API_URL` puede quedar vacío.

### Scripts

| Comando (raíz) | Qué hace |
|---|---|
| `npm run dev` | Backend con recarga (tsx) + frontend (Vite) |
| `npm run build` | Compila backend (`prisma generate` + `tsc`) y frontend (`vite build`) |
| `npm start` | Arranca el backend compilado (`backend/dist`) |
| `npm run prisma:migrate` | `prisma migrate dev` (crea/aplica migraciones en local) |
| `npm run prisma:deploy -w backend` | `prisma migrate deploy` (producción) |
| `npm run bundle:eb -w backend` | Genera `backend-eb.zip` para Elastic Beanstalk |

### Variables de entorno

**Backend** (`backend/.env`)

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic. Solo vive en el backend. Sin ella, la landing funciona y el cotizador muestra un aviso. |
| `MODEL_CHAT` | Modelo de Claude. Por defecto `claude-opus-5-5`. Para reducir costos puedes usar `claude-sonnet-5-5` o `claude-haiku-5-5`. |
| `CHAT_EFFORT` | `low` (por defecto), `medium` o `high`: profundidad de razonamiento vs. costo. Vacío = valor por defecto del modelo. |
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. |
| `FRONTEND_URL` | Origen(es) permitidos por CORS, separados por coma. Ej.: `https://nocaimatech.lat,https://www.nocaimatech.lat` |
| `PORT` | Puerto HTTP (Elastic Beanstalk lo define solo). |

**Frontend** (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL pública del backend, sin `/` final. Vacío en local. |
| `VITE_WHATSAPP` | Número de WhatsApp con indicativo, solo dígitos. Ej.: `573001234567`. |

## API

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servicio |
| `POST` | `/api/waitlist` | `{ nombre, email, interes: "COMPONENTES" \| "WEB" \| "AMBOS" }` → 201, 400, 409 (correo duplicado), 429 |
| `POST` | `/api/chat` | `{ messages: [{ role, content }] }` → `text/event-stream` |

`/api/chat` responde eventos `data: {json}`: `text` (fragmento de respuesta),
`status` (p. ej. "Buscando procesadores en el catálogo…"), `done` y `error`
(mensaje amigable). Límites: 20 mensajes por conversación, 1000 caracteres por
mensaje, 20 peticiones cada 15 minutos por IP.

### Cómo funciona el cotizador

1. El frontend envía el historial (solo textos; nada se guarda en el servidor).
2. El backend llama a Claude con dos herramientas que leen `catalog.json`:
   - `buscar_productos(categoria, presupuesto_max?)`
   - `verificar_compatibilidad(ids)`: socket CPU↔board, tipo de RAM, formato
     board↔chasis, disipador y fuente ≥ consumo estimado × 1,3.
3. El bucle se repite hasta que Claude responde (máx. 8 vueltas) y el texto llega
   en streaming. La tabla final termina en una fila **Total**; al detectarla, el
   frontend muestra **Continuar por WhatsApp** con el resumen prellenado.

Para editar el catálogo basta con modificar `backend/data/catalog.json` (se
valida con zod al arrancar) y reiniciar el backend.

## Despliegue en AWS

### 1. Base de datos

- **Opción gratuita:** [Neon](https://neon.tech) o [Supabase](https://supabase.com)
  (plan free). Copia la cadena de conexión con `?sslmode=require`.
- **Opción AWS:** Amazon RDS for PostgreSQL (`db.t4g.micro`, capa gratuita el
  primer año). Ponla en la misma VPC que Elastic Beanstalk y permite el puerto
  5432 desde el security group de las instancias de EB.

### 2. Backend en Elastic Beanstalk

1. Crea una aplicación en EB con la plataforma **Node.js 22 on Amazon Linux 2023**
   (entorno *Web server*, instancia `t3.micro` o `t4g.micro`).
2. En *Configuración → Variables de entorno* define `ANTHROPIC_API_KEY`,
   `MODEL_CHAT`, `CHAT_EFFORT`, `DATABASE_URL` y
   `FRONTEND_URL=https://nocaimatech.lat,https://www.nocaimatech.lat`.
3. Genera el paquete y súbelo como nueva versión:
   ```bash
   npm run bundle:eb -w backend      # crea backend-eb.zip en la raíz
   ```
   EB ejecuta `npm install` (que corre `prisma generate`). El hook
   `.platform/hooks/predeploy/01_prisma_migrate.sh` aplica las migraciones y el
   `Procfile` arranca con `npm start`.
4. HTTPS: agrega un certificado de ACM al balanceador (o usa CloudFront) y crea
   el registro `api.nocaimatech.lat` en tu DNS apuntando al entorno.
5. El streaming funciona detrás de nginx gracias al encabezado
   `X-Accel-Buffering: no`. Si usas balanceador, sube el *idle timeout* a 120 s.

### 3. Frontend en AWS Amplify Hosting

1. *New app → Host web app* y conecta este repositorio (rama de producción).
2. Amplify detecta `amplify.yml` (monorepo con `appRoot: frontend`).
3. Variables de entorno: `VITE_API_URL=https://api.nocaimatech.lat` y
   `VITE_WHATSAPP=57XXXXXXXXXX`.
4. *Rewrites and redirects* → agrega la regla SPA para que `/cotizador` funcione
   al recargar:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
   - Target: `/index.html` · Type: `200 (Rewrite)`
5. *Domain management* → conecta `nocaimatech.lat` y `www`.

## Seguridad y costos

- La API key nunca llega al navegador; CORS solo admite `FRONTEND_URL`.
- `helmet`, límite de 64 KB por petición, validación con zod en todas las rutas.
- Rate limit: chat 20/15 min y lista de espera 10/15 min por IP.
- `max_tokens` 8192 por respuesta, máximo 8 vueltas de herramientas por mensaje,
  20 mensajes por conversación y `CHAT_EFFORT=low` por defecto.
- Si un clasificador de seguridad rechaza una respuesta, se reintenta en el
  modelo de respaldo recomendado (`fallbacks: "default"`).
