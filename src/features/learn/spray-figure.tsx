// Geometría real: el segundo cuadrado está al doble de distancia de la boquilla
// y mide el doble de lado, así que las líneas del cono tocan las esquinas de ambos.
export function SprayFigure() {
  return (
    <figure className="mt-4">
      <svg
        viewBox="0 0 300 116"
        role="img"
        aria-label="Un espray a la izquierda. A distancia r cubre un cuadrado. A distancia 2r cubre un cuadrado el doble de ancho y de alto, que equivale a cuatro de los anteriores."
        className="h-auto w-full max-w-sm"
        fill="none"
      >
        <g className="stroke-rule">
          <line x1="14" y1="50" x2="254" y2="10" />
          <line x1="14" y1="50" x2="254" y2="90" />
        </g>
        <rect x="6" y="44" width="8" height="12" className="fill-ink" />
        <rect
          x="114"
          y="30"
          width="40"
          height="40"
          className="fill-paper-deep stroke-ink"
        />
        <g className="stroke-ink">
          <rect x="214" y="10" width="80" height="80" className="fill-paper" />
          <line x1="254" y1="10" x2="254" y2="90" />
          <line x1="214" y1="50" x2="294" y2="50" />
        </g>
        <g className="fill-ink text-[13px] italic" textAnchor="middle">
          <text x="134" y="110">
            distancia r
          </text>
          <text x="254" y="110">
            distancia 2r
          </text>
        </g>
      </svg>
      <figcaption className="mt-1 text-ink-soft italic">
        Fig. 2. La misma pintura cubre cuatro veces más superficie.
      </figcaption>
    </figure>
  );
}
