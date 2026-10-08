import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const Cotizador = lazy(() => import("./pages/Cotizador"));

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-bg" />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cotizador" element={<Cotizador />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
