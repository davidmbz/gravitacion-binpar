import {
  FLIGHT_DURATION,
  type Launch,
  type LaunchOutcome,
} from "@/lib/physics/moon-launch";

const number = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

export function formatLaunch({ speed, angle }: Launch): string {
  return `velocidad ${number.format(speed)}, ángulo ${angle} grados`;
}

export function formatSpeed(speed: number): string {
  return number.format(speed);
}

/** Texto del resultado. Se apoya en la clasificación exacta, no en el tramo visto. */
export function describeOutcome(outcome: LaunchOutcome): string {
  switch (outcome.kind) {
    case "crash":
      return "Choque: su trayectoria corta el planeta. No avanza lo bastante de lado para fallarlo.";
    case "escape":
      return "Escape: va tan rápido que la gravedad no la retiene. No volverá.";
    case "orbit":
      return outcome.period > FLIGHT_DURATION
        ? "Órbita muy abierta: la gravedad la retiene, pero tarda en volver más de lo que se ha calculado."
        : `Órbita: cae todo el tiempo y siempre falla el planeta. Da una vuelta cada ${number.format(outcome.period)} unidades de tiempo.`;
  }
}
