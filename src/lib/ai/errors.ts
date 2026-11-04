import Anthropic from "@anthropic-ai/sdk";

export interface TutorFailure {
  httpStatus: number;
  message: string;
}

export const UNAVAILABLE: TutorFailure = {
  httpStatus: 503,
  message:
    "El tutor no está disponible ahora. La mesa y las predicciones siguen funcionando.",
};

/** De la clase más concreta a la más general: el orden importa. */
export function failureFromError(error: unknown): TutorFailure {
  if (error instanceof Anthropic.RateLimitError) {
    return {
      httpStatus: 429,
      message:
        "El tutor ha recibido demasiadas preguntas. Prueba en un minuto.",
    };
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return {
      httpStatus: 504,
      message: "El tutor ha tardado demasiado. Vuelve a enviar tu pregunta.",
    };
  }
  if (error instanceof Anthropic.APIError) {
    return UNAVAILABLE;
  }
  throw error;
}
