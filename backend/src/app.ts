import express from "express";
import cors from "cors";
import helmet from "helmet";
import { allowedOrigins } from "./env.js";
import { waitlistRouter } from "./routes/waitlist.js";
import { chatRouter } from "./routes/chat.js";
import { catalogo } from "./catalog.js";

export const app = express();

// Elastic Beanstalk / balanceadores ponen la IP real en X-Forwarded-For (necesario para el rate limit).
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
    methods: ["GET", "POST"],
  }),
);
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, productos: catalogo.productos.length });
});

app.use("/api/waitlist", waitlistRouter);
app.use("/api/chat", chatRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError) {
    res.status(400).json({ error: "JSON inválido" });
    return;
  }
  console.error("[app] error no controlado", err);
  res.status(500).json({ error: "Error interno del servidor" });
});
