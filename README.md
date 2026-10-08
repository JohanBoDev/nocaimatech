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

Comparte la infraestructura de Atlas (cuenta `798645002528`, perfil `atlas`,
`us-east-1`). Costo adicional: prácticamente cero (Amplify con poco tráfico).

```
nocaimatech.lat / www ──► Amplify (app d2tnmbh87gxu60, zip manual)
api.nocaimatech.lat ──► IP elástica 98.91.152.171 (EC2 atlas-ec2)
                         └─ Caddy de Atlas (TLS de Let's Encrypt)
                              └─ contenedor nocaimatech-api ──► RDS atlas-db / nocaimatech_prod
```

**DNS** en Namecheap: `A api → 98.91.152.171`, `ALIAS @` y `CNAME www` →
`d3vavwwple59h8.cloudfront.net`, más el CNAME de validación de ACM que da Amplify.

### Base de datos

Base `nocaimatech_prod` en la RDS de Atlas, con su propio usuario `nocaima`
(sin permiso de conexión a `atlas_prod`). La `DATABASE_URL` del `.env` del
servidor (`~/nocaimatech/backend/.env`, permisos 600) lleva:

```
?schema=public&sslmode=require&sslcert=/app/certs/rds-ca.pem&sslaccept=strict
```

RDS exige TLS. El motor de Prisma 6 solo lee **el primer** certificado de un
PEM, así que el `Dockerfile` extrae del bundle de us-east-1 la raíz que usa la
instancia (`RSA2048 G1`). Si la CA de la instancia cambia, se ajusta
`RDS_CA_SUBJECT`.

### Backend (EC2, Docker)

A la EC2 se entra por SSM (`aws ssm send-command`), no por SSH. Los comandos
corren como root: lo que toque el repo va con `sudo -iu ubuntu`.

```bash
sudo -iu ubuntu bash -c 'cd ~/nocaimatech && git pull --ff-only'
cd /home/ubuntu/nocaimatech
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm nocaimatech-api npx prisma migrate deploy   # si hay migraciones
docker compose -f docker-compose.prod.yml up -d
```

El contenedor no publica puertos y tiene un tope de 256 MB para no quitarle
memoria a Atlas. Caddy (repo `atlas-backend`) importa `~/caddy-sites/*.caddy`;
el sitio está en `deploy/caddy/nocaimatech.caddy` (si cambia, se copia allí y se
recarga con `docker exec atlas-caddy caddy reload --config /etc/caddy/Caddyfile`).

### Frontend (Amplify)

```bash
VITE_API_URL=https://api.nocaimatech.lat VITE_WHATSAPP=573224395306 npm run build -w frontend
# zip de frontend/dist CON entradas de directorio (Compress-Archive no sirve)
aws amplify create-deployment --profile atlas --app-id d2tnmbh87gxu60 --branch-name main
curl -X PUT --data-binary @dist.zip "<zipUploadUrl>"
aws amplify start-deployment --profile atlas --app-id d2tnmbh87gxu60 --branch-name main --job-id <id>
```

La app ya tiene la regla SPA (todo lo que no sea un archivo estático → `/index.html`).
Si el backend cambia de contrato, se despliega **primero** el backend.

## Seguridad y costos

- La API key nunca llega al navegador; CORS solo admite `FRONTEND_URL`.
- `helmet`, límite de 64 KB por petición, validación con zod en todas las rutas.
- Rate limit: chat 20/15 min y lista de espera 10/15 min por IP.
- `max_tokens` 8192 por respuesta, máximo 8 vueltas de herramientas por mensaje,
  20 mensajes por conversación y `CHAT_EFFORT=low` por defecto.
- Si un clasificador de seguridad rechaza una respuesta, se reintenta en el
  modelo de respaldo recomendado (`fallbacks: "default"`).
