import { env } from "./env.js";
import { app } from "./app.js";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 API de NocaimaTech escuchando en http://localhost:${env.PORT}`);
});

// `docker stop` envía SIGTERM: se dejan de aceptar conexiones y se cierran las abiertas
// (los streams SSE no terminan solos) antes de los 10 s en que Docker mata el proceso.
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
  server.closeAllConnections();
});
