import {
  COMPARISON_DURATION,
  PERTURBATION_SIZE,
  VISIBLE_SEPARATION,
  type OrbitComparison,
} from "@/lib/physics/perturbation";

// Decimales fijos: la lectura cambia en cada fotograma y no debe temblar.
const twoDecimals = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const oneDecimal = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatSeparation(separation: number): string {
  return separation < 0.01 ? "menos de 0,01" : twoDecimals.format(separation);
}

export function formatTime(time: number): string {
  return oneDecimal.format(time);
}

/** Resume la comparación sin atribuirle más de lo que una sola prueba muestra. */
export function describeComparison({
  peakSeparation,
  visibleAt,
}: OrbitComparison): string {
  const start = `Dos cuerpos empezaron desplazados ${PERTURBATION_SIZE.toLocaleString("es-ES")} unidades.`;

  if (visibleAt === null) {
    return `${start} En ${COMPARISON_DURATION} unidades de tiempo, la separación no pasó de ${formatSeparation(peakSeparation)}: aún no se distingue a simple vista.`;
  }

  const growth = Math.round(VISIBLE_SEPARATION / PERTURBATION_SIZE);
  return `${start} En el instante ${formatTime(visibleAt)}, la separación ya era ${growth} veces mayor, y llegó a ${formatSeparation(peakSeparation)}.`;
}
