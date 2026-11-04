import {
  TUTOR_LIMITS,
  tutorResponseSchema,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/ai/schemas";

export type ChatMessage = TutorRequest["messages"][number];

export type ChatPhase =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "error"; message: string };

export type ChatState = {
  messages: ChatMessage[];
  phase: ChatPhase;
};

export type ChatAction =
  | { type: "sent"; content: string }
  | { type: "replied"; content: string }
  | { type: "failed"; message: string }
  | { type: "reset" };

export const INITIAL_CHAT_STATE: ChatState = {
  messages: [],
  phase: { status: "idle" },
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "sent":
      return {
        messages: [
          ...state.messages,
          { role: "user", content: action.content },
        ],
        phase: { status: "sending" },
      };

    case "replied":
      return {
        messages: [
          ...state.messages,
          { role: "assistant", content: action.content },
        ],
        phase: { status: "idle" },
      };

    // La pregunta sale del historial y sigue en el cuadro de texto, para que
    // reenviarla no deje dos mensajes seguidos sin respuesta.
    case "failed":
      return {
        messages: state.messages.slice(0, -1),
        phase: { status: "error", message: action.message },
      };

    case "reset":
      return INITIAL_CHAT_STATE;
  }
}

/** Cada turno añade dos mensajes: el siguiente envío no debe superar el límite. */
export function isConversationFull(messages: readonly ChatMessage[]): boolean {
  return messages.length >= TUTOR_LIMITS.messages;
}

const NETWORK_FAILURE: TutorResponse = {
  status: "error",
  message: "No se ha podido contactar con el tutor. Revisa tu conexión.",
};

const INVALID_RESPONSE: TutorResponse = {
  status: "error",
  message: "El tutor ha enviado una respuesta que no se puede leer.",
};

export async function askTutor(request: TutorRequest): Promise<TutorResponse> {
  let response: Response;
  try {
    response = await fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch (error) {
    console.error("Fallo de red al llamar al tutor", error);
    return NETWORK_FAILURE;
  }

  const body: unknown = await response.json().catch(() => null);
  const parsed = tutorResponseSchema.safeParse(body);
  return parsed.success ? parsed.data : INVALID_RESPONSE;
}
