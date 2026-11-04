import type Anthropic from "@anthropic-ai/sdk";
import {
  formatMultiple,
  relativeForce,
  type Scene,
} from "@/features/learn/scene";
import {
  CONFIGURE_SCENE_TOOL,
  describeAppState,
  SYSTEM_PROMPT,
} from "./prompt";
import { sceneSchema, type TutorRequest } from "./schemas";

/** Tope de salida por vuelta, razonamiento incluido. */
const MAX_OUTPUT_TOKENS = 1500;

export type ModelReply = Pick<Anthropic.Message, "content" | "stop_reason">;

export type CreateMessage = (
  params: Anthropic.MessageCreateParamsNonStreaming,
) => Promise<ModelReply>;

export type TutorResult =
  | { status: "ok"; reply: string; scene: Scene | null }
  | { status: "refused" }
  | { status: "empty" };

/**
 * Como máximo dos llamadas al modelo: la primera puede usar la herramienta y
 * la segunda, si hace falta, tiene las herramientas bloqueadas y debe responder.
 */
export async function runTutor(
  createMessage: CreateMessage,
  model: string,
  request: TutorRequest,
): Promise<TutorResult> {
  const messages = toModelMessages(request);
  // Con la predicción pendiente no se ofrece la herramienta: mover la mesa
  // revelaría el resultado. En el paso de la luna no hay mesa que mover.
  const canMoveTable =
    request.answers[request.stepId] !== null && request.stepId !== "orbit";
  const tools = canMoveTable ? [CONFIGURE_SCENE_TOOL] : [];

  const baseParams = {
    model,
    max_tokens: MAX_OUTPUT_TOKENS,
    output_config: { effort: "low" },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools,
  } satisfies Partial<Anthropic.MessageCreateParamsNonStreaming>;

  const first = await createMessage({
    ...baseParams,
    messages,
    ...(tools.length > 0 && {
      tool_choice: { type: "auto", disable_parallel_tool_use: true },
    }),
  });

  if (first.stop_reason === "refusal") return { status: "refused" };

  const toolUse = first.content.find((block) => block.type === "tool_use");
  // Una llamada cortada por max_tokens puede parecer válida: no se ejecuta.
  if (!toolUse || first.stop_reason !== "tool_use") {
    return finish(first, null);
  }

  const parsed = sceneSchema.safeParse(toolUse.input);
  const scene = parsed.success ? parsed.data : null;

  const second = await createMessage({
    ...baseParams,
    tool_choice: { type: "none" },
    messages: [
      ...messages,
      // Contenido íntegro: el API exige los bloques de razonamiento sin tocar.
      { role: "assistant", content: first.content },
      {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUse.id,
            is_error: !parsed.success,
            content: parsed.success
              ? `Escena aplicada. Fuerza ${formatMultiple(relativeForce(parsed.data))} respecto a la escena inicial.`
              : "Valores fuera de los límites de la mesa. La escena no ha cambiado.",
          },
        ],
      },
    ],
  });

  if (second.stop_reason === "refusal") return { status: "refused" };
  return finish(second, scene);
}

function finish(reply: ModelReply, scene: Scene | null): TutorResult {
  const text = reply.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  return text ? { status: "ok", reply: text, scene } : { status: "empty" };
}

/**
 * El historial viaja como texto. El estado va en un bloque aparte del mensaje
 * de la persona, para que su texto nunca se mezcle con datos de la app.
 */
function toModelMessages(request: TutorRequest): Anthropic.MessageParam[] {
  const last = request.messages.length - 1;
  return request.messages.map((message, index) =>
    index === last
      ? {
          role: "user",
          content: [
            { type: "text", text: describeAppState(request) },
            { type: "text", text: message.content },
          ],
        }
      : message,
  );
}
