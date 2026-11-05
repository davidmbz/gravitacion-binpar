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
      return "Choque: no avanza lo bastante de lado y acaba estrellada contra el planeta.";
    case "escape":
      return "Escape: va demasiado rápido y la gravedad ya no puede retenerla.";
    case "orbit":
      return outcome.period > FLIGHT_DURATION
        ? "Órbita muy abierta: la gravedad la retiene, pero tarda en volver más de lo que se ha calculado."
        : `Órbita: cae sin parar y nunca llega a tocar el planeta. Da una vuelta cada ${number.format(outcome.period)} unidades de tiempo.`;
  }
}
