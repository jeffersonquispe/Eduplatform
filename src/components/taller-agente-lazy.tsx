"use client";

import dynamic from "next/dynamic";

// El taller (SVG isometrico + audio, ~13 KiB de JS y ~45 KB de HTML renderizado) no es necesario para pintar
// la pagina: se carga en un chunk aparte despues de hidratar y no se prerenderiza. El marcador reserva las
// mismas medidas que el componente real (caja 16:9 y fila de controles) para no desplazar el contenido.
const TallerAgente = dynamic(() => import("@/components/taller-agente"), {
  ssr: false,
  loading: () => (
    <div aria-hidden="true">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border"
        style={{ aspectRatio: "16 / 9", background: "#0A1B33" }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="eb-btn invisible">Reproducir</span>
      </div>
    </div>
  ),
});

export default TallerAgente;
