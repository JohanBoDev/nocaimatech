import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-ink" aria-label="NocaimaTech, ir al inicio" translate="no">
      <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7" />
      <span className="text-[1.05rem] font-semibold tracking-tight">NocaimaTech</span>
    </Link>
  );
}
