import { Router } from "express";
import { Prisma } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const WaitlistSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100, "El nombre es muy largo"),
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido")).pipe(z.string().max(254)),
  interes: z.enum(["COMPONENTES", "WEB", "AMBOS"], { message: "Elige un interés" }),
});

export const waitlistRouter = Router();

waitlistRouter.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Demasiados intentos. Vuelve a intentarlo en unos minutos." },
  }),
);

waitlistRouter.post("/", async (req, res) => {
  const parsed = WaitlistSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    return;
  }

  try {
    await prisma.waitlist.create({ data: parsed.data });
    res.status(201).json({ ok: true, mensaje: "¡Listo! Te avisaremos apenas lancemos." });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: "Este correo ya está en la lista de espera. ¡Ya te tenemos en cuenta!" });
      return;
    }
    console.error("[waitlist] error guardando registro", err);
    res.status(500).json({ error: "No pudimos guardar tu registro. Intenta de nuevo más tarde." });
  }
});
