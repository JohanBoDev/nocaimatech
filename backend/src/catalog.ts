import { readFileSync } from "node:fs";
import { z } from "zod";

export const CATEGORIAS = [
  "CPU",
  "GPU",
  "RAM",
  "MOTHERBOARD",
  "PSU",
  "STORAGE",
  "CASE",
  "COOLER",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

const ProductoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  categoria: z.enum(CATEGORIAS),
  marca: z.string(),
  precioCOP: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  specs: z
    .object({
      socket: z.string().optional(),
      ramType: z.string().optional(),
      tdpW: z.number().optional(),
      psuWatts: z.number().optional(),
      formFactor: z.string().optional(),
      graficosIntegrados: z.boolean().optional(),
      formatosSoportados: z.array(z.string()).optional(),
      socketsSoportados: z.array(z.string()).optional(),
      tdpMaxW: z.number().optional(),
      psuRecomendadaW: z.number().optional(),
    })
    .catchall(z.unknown()),
});

const CatalogoSchema = z.object({
  moneda: z.literal("COP"),
  actualizado: z.string(),
  nota: z.string(),
  productos: z.array(ProductoSchema),
});

export type Producto = z.infer<typeof ProductoSchema>;

// El archivo vive en backend/data; esta ruta funciona igual desde src/ (tsx) y dist/ (node).
const CATALOG_PATH = new URL("../data/catalog.json", import.meta.url);

export const catalogo = CatalogoSchema.parse(
  JSON.parse(readFileSync(CATALOG_PATH, "utf-8")),
);

const porId = new Map(catalogo.productos.map((p) => [p.id, p]));

/** Consumo base de ventiladores, USB, etc. que no aparece en el catálogo. */
const CONSUMO_BASE_W = 50;
/** Margen de seguridad exigido sobre el consumo estimado. */
const MARGEN_PSU = 0.3;

export function buscarProductos(categoria: Categoria, presupuestoMax?: number) {
  return catalogo.productos
    .filter((p) => p.categoria === categoria)
    .filter((p) => presupuestoMax === undefined || p.precioCOP <= presupuestoMax)
    .sort((a, b) => a.precioCOP - b.precioCOP)
    .map((p) => ({ ...p, disponible: p.stock > 0 }));
}

export interface ResultadoCompatibilidad {
  compatible: boolean;
  errores: string[];
  advertencias: string[];
  idsNoEncontrados: string[];
  consumoEstimadoW: number;
  potenciaRequeridaW: number;
  potenciaFuenteW: number | null;
  totalCOP: number;
  componentes: { id: string; nombre: string; categoria: Categoria; precioCOP: number; stock: number }[];
}

export function verificarCompatibilidad(ids: string[]): ResultadoCompatibilidad {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const idsNoEncontrados = ids.filter((id) => !porId.has(id));
  const productos = ids.map((id) => porId.get(id)).filter((p): p is Producto => !!p);

  for (const id of idsNoEncontrados) {
    errores.push(`El id "${id}" no existe en el catálogo.`);
  }

  const de = (c: Categoria) => productos.filter((p) => p.categoria === c);
  const [cpus, gpus, rams, boards, psus, storages, cases, coolers] = CATEGORIAS.map(de);

  for (const [lista, nombre] of [
    [cpus, "procesador"],
    [boards, "board"],
    [psus, "fuente"],
    [cases, "chasis"],
  ] as const) {
    if (lista.length > 1) errores.push(`Hay más de un ${nombre} en la configuración.`);
  }

  const cpu = cpus[0];
  const board = boards[0];
  const psu = psus[0];
  const chasis = cases[0];

  if (cpu && board && cpu.specs.socket !== board.specs.socket) {
    errores.push(
      `Socket incompatible: el procesador usa ${cpu.specs.socket} y la board ${board.specs.socket}.`,
    );
  }

  if (board) {
    for (const ram of rams) {
      if (ram.specs.ramType !== board.specs.ramType) {
        errores.push(
          `Tipo de RAM incompatible: "${ram.nombre}" es ${ram.specs.ramType} y la board solo admite ${board.specs.ramType}.`,
        );
      }
    }
  }

  if (board && chasis) {
    const soportados = chasis.specs.formatosSoportados ?? [chasis.specs.formFactor];
    if (!soportados.includes(board.specs.formFactor)) {
      errores.push(
        `La board (${board.specs.formFactor}) no cabe en el chasis (admite ${soportados.join(", ")}).`,
      );
    }
  }

  if (cpu) {
    for (const cooler of coolers) {
      if (!cooler.specs.socketsSoportados?.includes(cpu.specs.socket ?? "")) {
        errores.push(`El disipador "${cooler.nombre}" no es compatible con el socket ${cpu.specs.socket}.`);
      } else if ((cooler.specs.tdpMaxW ?? 0) < (cpu.specs.tdpW ?? 0)) {
        advertencias.push(
          `El disipador "${cooler.nombre}" soporta ${cooler.specs.tdpMaxW} W y el procesador puede llegar a ${cpu.specs.tdpW} W.`,
        );
      }
    }
    if (coolers.length === 0 && (cpu.specs.tdpW ?? 0) > 100) {
      advertencias.push(
        `El procesador ${cpu.nombre} no trae disipador adecuado para su consumo; conviene agregar uno.`,
      );
    }
    if (gpus.length === 0 && cpu.specs.graficosIntegrados === false) {
      errores.push(`El procesador ${cpu.nombre} no tiene gráficos integrados: necesita tarjeta de video.`);
    }
  }

  const consumoEstimadoW =
    productos.filter((p) => p.categoria !== "PSU").reduce((s, p) => s + (p.specs.tdpW ?? 0), 0) +
    CONSUMO_BASE_W;
  const potenciaRequeridaW = Math.ceil(consumoEstimadoW * (1 + MARGEN_PSU));

  if (psu) {
    const watts = psu.specs.psuWatts ?? 0;
    if (watts < potenciaRequeridaW) {
      errores.push(
        `La fuente de ${watts} W no cubre el consumo estimado de ${consumoEstimadoW} W con 30% de margen (se requieren ${potenciaRequeridaW} W).`,
      );
    }
    for (const gpu of gpus) {
      if (gpu.specs.psuRecomendadaW && watts < gpu.specs.psuRecomendadaW) {
        advertencias.push(
          `El fabricante de "${gpu.nombre}" recomienda una fuente de al menos ${gpu.specs.psuRecomendadaW} W.`,
        );
      }
    }
  }

  const faltantes: string[] = [];
  if (!cpu) faltantes.push("procesador (CPU)");
  if (!board) faltantes.push("board (MOTHERBOARD)");
  if (rams.length === 0) faltantes.push("memoria RAM");
  if (storages.length === 0) faltantes.push("almacenamiento (STORAGE)");
  if (!psu) faltantes.push("fuente de poder (PSU)");
  if (!chasis) faltantes.push("chasis (CASE)");
  if (faltantes.length > 0) {
    advertencias.push(`Configuración incompleta, falta: ${faltantes.join(", ")}.`);
  }

  for (const p of productos) {
    if (p.stock === 0) advertencias.push(`"${p.nombre}" está agotado; debe reemplazarse.`);
  }

  return {
    compatible: errores.length === 0,
    errores,
    advertencias,
    idsNoEncontrados,
    consumoEstimadoW,
    potenciaRequeridaW,
    potenciaFuenteW: psu?.specs.psuWatts ?? null,
    totalCOP: productos.reduce((s, p) => s + p.precioCOP, 0),
    componentes: productos.map(({ id, nombre, categoria, precioCOP, stock }) => ({
      id,
      nombre,
      categoria,
      precioCOP,
      stock,
    })),
  };
}
