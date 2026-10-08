import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buscarProductos, CATEGORIAS, verificarCompatibilidad } from "../catalog.js";

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "buscar_productos",
    description:
      "Busca productos del catálogo de NocaimaTech por categoría, ordenados del más barato al más caro. " +
      "Devuelve id, nombre, marca, precioCOP, stock, disponible y specs (socket, ramType, tdpW, psuWatts, formFactor, etc.). " +
      "Úsala antes de recomendar cualquier componente; es la única fuente válida de productos y precios.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        categoria: { type: "string", enum: [...CATEGORIAS], description: "Categoría del componente." },
        presupuesto_max: {
          type: "integer",
          description: "Precio máximo en COP para filtrar productos de esta categoría (opcional).",
        },
      },
      required: ["categoria"],
    },
  },
  {
    name: "verificar_compatibilidad",
    description:
      "Verifica una configuración completa por ids del catálogo: socket CPU↔board, tipo de RAM↔board, formato board↔chasis, " +
      "disipador↔socket y que la fuente cubra el consumo estimado con 30% de margen. Devuelve errores, advertencias, " +
      "consumo estimado y totalCOP. Úsala siempre antes de presentar la configuración final.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        ids: {
          type: "array",
          items: { type: "string" },
          description: "Ids de los productos de la configuración (uno por componente).",
        },
      },
      required: ["ids"],
    },
  },
];

const BuscarInput = z.object({
  categoria: z.enum(CATEGORIAS),
  presupuesto_max: z.number().int().positive().optional(),
});
const VerificarInput = z.object({ ids: z.array(z.string()).min(1).max(15) });

/** Texto que ve el usuario mientras se ejecuta cada herramienta. */
export function describirHerramienta(name: string, input: unknown): string {
  if (name === "buscar_productos") {
    const parsed = BuscarInput.safeParse(input);
    const etiquetas: Record<string, string> = {
      CPU: "procesadores",
      GPU: "tarjetas de video",
      RAM: "memorias RAM",
      MOTHERBOARD: "boards",
      PSU: "fuentes de poder",
      STORAGE: "almacenamiento",
      CASE: "chasis",
      COOLER: "disipadores",
    };
    return parsed.success ? `Buscando ${etiquetas[parsed.data.categoria]} en el catálogo…` : "Buscando en el catálogo…";
  }
  if (name === "verificar_compatibilidad") return "Verificando compatibilidad y consumo eléctrico…";
  return "Consultando…";
}

/**
 * Ejecuta una herramienta y devuelve el tool_result. Con eager_input_streaming la API
 * no valida el input, así que se valida aquí con zod antes de ejecutar.
 */
export function ejecutarHerramienta(block: Anthropic.Beta.BetaToolUseBlock): Anthropic.Beta.BetaToolResultBlockParam {
  const error = (content: string): Anthropic.Beta.BetaToolResultBlockParam => ({
    type: "tool_result",
    tool_use_id: block.id,
    is_error: true,
    content,
  });

  switch (block.name) {
    case "buscar_productos": {
      const parsed = BuscarInput.safeParse(block.input);
      if (!parsed.success) return error(JSON.stringify({ INVALID_JSON: JSON.stringify(block.input) }));
      const productos = buscarProductos(parsed.data.categoria, parsed.data.presupuesto_max);
      return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify({ productos }) };
    }
    case "verificar_compatibilidad": {
      const parsed = VerificarInput.safeParse(block.input);
      if (!parsed.success) return error(JSON.stringify({ INVALID_JSON: JSON.stringify(block.input) }));
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(verificarCompatibilidad(parsed.data.ids)),
      };
    }
    default:
      return error(`Herramienta desconocida: ${block.name}`);
  }
}
