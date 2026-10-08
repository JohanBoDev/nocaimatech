import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * Placa madre ilustrada: las pistas se enrutan desde "tu pedido" (J1) hacia cada
 * componente y estos se "pueblan" con el producto y su precio. Ejemplo con productos
 * reales del catálogo. Es el único momento animado de la landing y arranca al verse.
 */
const d = (s: number): CSSProperties => ({ ["--delay" as string]: `${s}s` });

const pistas = [
  { id: "cpu", path: "M60 190 H140 L170 160 V120 H200", delay: 0.3 },
  { id: "ram", path: "M60 180 H120 L150 150 V40 H387 V50", delay: 0.55 },
  { id: "ssd", path: "M60 205 H170 L190 225 H200", delay: 0.8 },
  { id: "gpu", path: "M60 215 H90 L110 235 V275", delay: 1.05 },
  { id: "psu", path: "M60 225 H70 L85 240 V258 H440 L460 278", delay: 1.3 },
];

const silk = "#F0EEE6";
const gold = "#E2A84B";
const trace = "#33312C";
const fill = "#252420";

export function BoardCompat() {
  const ref = useRef<HTMLElement>(null);
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActivo(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const trazo = activo ? "pcb-trace" : "opacity-0";
  const revelar = activo ? "pcb-reveal" : "opacity-0";

  return (
    <figure ref={ref} className="w-full">
      <svg viewBox="0 0 520 420" className="h-auto w-full" role="img" aria-labelledby="placa-titulo placa-desc">
        <title id="placa-titulo">Ejemplo de configuración armada por el asesor</title>
        <desc id="placa-desc">
          Procesador Ryzen 5 7600 por $869.000, 32 GB de RAM DDR5 por $699.000, SSD de 1 TB por $279.000, tarjeta RTX
          4060 por $1.399.000 y fuente de 550 W por $269.000.
        </desc>

        {/* Placa */}
        <rect x="10" y="10" width="500" height="400" rx="14" fill="#1C1B19" stroke={trace} strokeWidth="2" />
        {[
          [34, 34],
          [486, 34],
          [34, 386],
          [486, 386],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" fill="#131211" stroke={gold} strokeOpacity="0.45" strokeWidth="3" />
        ))}

        {/* Pistas apagadas de fondo (decorativas) */}
        <g stroke={trace} strokeWidth="2" fill="none" opacity="0.9">
          <path d="M40 330 H150 L170 350 H300" />
          <path d="M40 345 H140 L160 365 H260" />
          <path d="M330 350 H420 L440 330 V200" />
          <path d="M220 200 V190 H300 V200" />
        </g>

        {/* Conector de entrada: tu pedido */}
        <g>
          <rect x="18" y="168" width="42" height="66" rx="4" fill="#131211" stroke={gold} strokeWidth="2" />
          {[180, 190, 205, 215, 225].map((y) => (
            <rect key={y} x="52" y={y - 3} width="8" height="6" fill={gold} />
          ))}
          <text x="39" y="160" textAnchor="middle" fontSize="11" fill={silk} opacity="0.7">J1</text>
          <text x="39" y="252" textAnchor="middle" fontSize="11" fill={silk} opacity="0.7">tu pedido</text>
        </g>

        {/* Huellas de componentes (serigrafía) */}
        <g fill="none" stroke={silk} strokeOpacity="0.35" strokeWidth="1.5">
          <rect x="200" y="60" width="120" height="120" rx="4" />
          {[360, 378, 396, 414].map((x) => (
            <rect key={x} x={x} y="50" width="10" height="150" rx="2" />
          ))}
          <rect x="200" y="215" width="150" height="22" rx="3" />
          <rect x="70" y="290" width="360" height="16" rx="2" />
          <rect x="460" y="230" width="30" height="96" rx="3" />
        </g>
        <g fontSize="11" fill={silk} opacity="0.55">
          <text x="200" y="53">U1</text>
          <text x="432" y="62">DIMM</text>
          <text x="356" y="232" textAnchor="end">M2_1</text>
          <text x="70" y="320">PCIE_X16</text>
          <text x="490" y="340" textAnchor="end">ATX</text>
        </g>

        {/* Pistas activas: se enrutan una tras otra */}
        <g fill="none" stroke={gold} strokeWidth="3" strokeLinejoin="round">
          {pistas.map((p) => (
            <path key={p.id} d={p.path} pathLength={1} className={trazo} style={d(p.delay)} />
          ))}
        </g>

        {/* Componentes poblados */}
        <g className={revelar} style={d(1.1)}>
          <rect x="206" y="66" width="108" height="108" rx="3" fill={fill} stroke={gold} strokeWidth="1.5" />
          <path d="M206 66 l12 0 l-12 12z" fill={gold} />
          <text x="260" y="112" textAnchor="middle" fontSize="13" fontWeight="600" fill={silk}>Ryzen 5 7600</text>
          <text x="260" y="134" textAnchor="middle" fontSize="13" fill={gold} className="tnum">$869.000</text>
        </g>
        <g className={revelar} style={d(1.35)}>
          <rect x="360" y="50" width="10" height="150" rx="2" fill={gold} fillOpacity="0.75" />
          <rect x="396" y="50" width="10" height="150" rx="2" fill={gold} fillOpacity="0.75" />
          <text x="392" y="216" textAnchor="middle" fontSize="12" fill={silk}>32 GB DDR5</text>
          <text x="392" y="244" textAnchor="middle" fontSize="12" fill={gold} className="tnum">$699.000</text>
        </g>
        <g className={revelar} style={d(1.6)}>
          <rect x="200" y="215" width="150" height="22" rx="3" fill={fill} stroke={gold} strokeWidth="1.5" />
          <text x="210" y="230" fontSize="11" fill={silk}>SSD 1 TB</text>
          <text x="342" y="230" textAnchor="end" fontSize="11" fill={gold} className="tnum">$279.000</text>
        </g>
        <g className={revelar} style={d(1.85)}>
          <rect x="70" y="275" width="360" height="44" rx="4" fill={fill} stroke={gold} strokeWidth="1.5" />
          <text x="84" y="302" fontSize="13" fontWeight="600" fill={silk}>RTX 4060 8 GB</text>
          <text x="418" y="302" textAnchor="end" fontSize="13" fill={gold} className="tnum">$1.399.000</text>
        </g>
        <g className={revelar} style={d(2.1)}>
          <rect x="460" y="230" width="30" height="96" rx="3" fill={fill} stroke={gold} strokeWidth="1.5" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x="467" y={240 + i * 13} width="16" height="7" rx="1" fill={gold} fillOpacity="0.8" />
          ))}
          <text x="452" y="360" textAnchor="end" fontSize="11" fill={silk}>Fuente 550 W</text>
          <text x="452" y="376" textAnchor="end" fontSize="11" fill={gold} className="tnum">$269.000</text>
        </g>
      </svg>

      <figcaption className={`${revelar} mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-line pt-4`} style={d(2.5)}>
        <span className="flex items-center gap-2 text-sm text-ink-dim">
          <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />
          Compatible: socket, RAM y fuente verificados
        </span>
        <span className="tnum text-ink">
          Total con board y chasis <strong className="ml-1 text-xl font-semibold text-accent">$4.503.000</strong>
        </span>
      </figcaption>
    </figure>
  );
}
