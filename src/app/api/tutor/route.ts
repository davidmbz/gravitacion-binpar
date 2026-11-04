import Anthropic from "@anthropic-ai/sdk";
import { failureFromError, UNAVAILABLE } from "@/lib/ai/errors";
import { isRateLimited } from "@/lib/ai/rate-limit";
import {
  TUTOR_LIMITS,
  tutorRequestSchema,
  type TutorResponse,
} from "@/lib/ai/schemas";
import { runTutor } from "@/lib/ai/tutor";

const REQUEST_TIMEOUT_MS = 30_000;

function respond(body: TutorResponse, status: number): Response {
  return Response.json(body, { status });
}

function failure(message: string, status: number): Response {
  return respond({ status: "error", message }, status);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function POST(request: Request): Promise<Response> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return failure("Has enviado muchas preguntas. Prueba en un minuto.", 429);
  }

  const body = await request.text();
  if (body.length > TUTOR_LIMITS.bodyBytes) {
    return failure("La conversación es demasiado larga.", 413);
  }

  const parsed = tutorRequestSchema.safeParse(parseJson(body));
  if (!parsed.success) {
    return failure("La pregunta no tiene un formato válido.", 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey || !model) {
    console.error("Faltan ANTHROPIC_API_KEY o ANTHROPIC_MODEL");
    return failure(UNAVAILABLE.message, UNAVAILABLE.httpStatus);
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 1,
    timeout: REQUEST_TIMEOUT_MS,
  });

  try {
    const result = await runTutor(
      // Si la persona se va, se cancela la llamada para no pagar lo que nadie lee.
      (params) => client.messages.create(params, { signal: request.signal }),
      model,
      parsed.data,
    );

    switch (result.status) {
      case "ok":
        return respond(result, 200);
      case "refused":
        return failure(
          "El tutor no puede responder a eso. Prueba a reformular tu pregunta sobre la gravedad.",
          422,
        );
      case "empty":
        return failure(UNAVAILABLE.message, 502);
    }
  } catch (error) {
    const { httpStatus, message } = failureFromError(error);
    console.error("Error del proveedor del tutor", error);
    return failure(message, httpStatus);
  }
}
