import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { INITIAL_SCENE } from "@/features/learn/scene";
import { INITIAL_LAUNCH } from "@/lib/physics/moon-launch";
import type { TutorRequest } from "./schemas";
import { runTutor, type CreateMessage, type ModelReply } from "./tutor";

const request: TutorRequest = {
  messages: [{ role: "user", content: "Enséñame la distancia" }],
  scene: INITIAL_SCENE,
  stepId: "distance",
  launch: INITIAL_LAUNCH,
  answers: {
    attraction: "equal-and-opposite",
    mass: null,
    distance: "half",
    orbit: null,
  },
};

function text(value: string): Anthropic.TextBlock {
  return { type: "text", text: value, citations: null };
}

function toolUse(input: unknown): Anthropic.ToolUseBlock {
  return {
    type: "tool_use",
    id: "toolu_1",
    name: "configurar_escena",
    input,
    caller: { type: "direct" },
  };
}

function fakeModel(...replies: ModelReply[]) {
  const queue = [...replies];
  return vi.fn<CreateMessage>(async () => {
    const reply = queue.shift();
    if (!reply) throw new Error("Llamada de más al modelo");
    return reply;
  });
}

const validScene = { massA: 4, massB: 2, distance: 8 };

describe("runTutor", () => {
  it("devuelve el texto sin mover la escena si no usa la herramienta", async () => {
    const model = fakeModel({
      content: [text("La fuerza baja más deprisa.")],
      stop_reason: "end_turn",
    });

    await expect(runTutor(model, "modelo", request)).resolves.toEqual({
      status: "ok",
      reply: "La fuerza baja más deprisa.",
      scene: null,
    });
    expect(model).toHaveBeenCalledTimes(1);
  });

  it("aplica la herramienta y hace una segunda vuelta sin herramientas", async () => {
    const model = fakeModel(
      { content: [toolUse(validScene)], stop_reason: "tool_use" },
      { content: [text("Mira la flecha.")], stop_reason: "end_turn" },
    );

    await expect(runTutor(model, "modelo", request)).resolves.toEqual({
      status: "ok",
      reply: "Mira la flecha.",
      scene: validScene,
    });

    const [secondParams] = model.mock.calls[1];
    expect(secondParams.tool_choice).toEqual({ type: "none" });
    expect(JSON.stringify(secondParams.messages)).toContain("×¼");
  });

  it("no hace más de dos llamadas aunque el modelo insista", async () => {
    const model = fakeModel(
      { content: [toolUse(validScene)], stop_reason: "tool_use" },
      { content: [toolUse(validScene)], stop_reason: "tool_use" },
    );

    await expect(runTutor(model, "modelo", request)).resolves.toEqual({
      status: "empty",
    });
    expect(model).toHaveBeenCalledTimes(2);
  });

  it("no aplica una escena fuera de los límites y avisa al modelo", async () => {
    const model = fakeModel(
      {
        content: [toolUse({ massA: 500, massB: 2, distance: 8 })],
        stop_reason: "tool_use",
      },
      { content: [text("No puedo hacer eso.")], stop_reason: "end_turn" },
    );

    const result = await runTutor(model, "modelo", request);

    expect(result).toEqual({
      status: "ok",
      reply: "No puedo hacer eso.",
      scene: null,
    });
    expect(JSON.stringify(model.mock.calls[1][0].messages)).toContain(
      '"is_error":true',
    );
  });

  it("no ejecuta una llamada cortada por max_tokens", async () => {
    const model = fakeModel({
      content: [text("Voy a mover"), toolUse(validScene)],
      stop_reason: "max_tokens",
    });

    await expect(runTutor(model, "modelo", request)).resolves.toEqual({
      status: "ok",
      reply: "Voy a mover",
      scene: null,
    });
    expect(model).toHaveBeenCalledTimes(1);
  });

  it("informa de una negativa en cualquiera de las dos vueltas", async () => {
    const first = fakeModel({ content: [], stop_reason: "refusal" });
    await expect(runTutor(first, "modelo", request)).resolves.toEqual({
      status: "refused",
    });

    const second = fakeModel(
      { content: [toolUse(validScene)], stop_reason: "tool_use" },
      { content: [], stop_reason: "refusal" },
    );
    await expect(runTutor(second, "modelo", request)).resolves.toEqual({
      status: "refused",
    });
  });

  it("no ofrece la herramienta con la predicción pendiente", async () => {
    const model = fakeModel({
      content: [text("¿Tú qué crees?")],
      stop_reason: "end_turn",
    });

    const answers = { ...request.answers, distance: null };
    await runTutor(model, "modelo", { ...request, answers });

    expect(model.mock.calls[0][0].tools).toEqual([]);
    expect(JSON.stringify(model.mock.calls[0][0].messages)).toContain(
      "Pendiente",
    );
  });

  it("no ofrece la herramienta en el paso de la luna", async () => {
    const model = fakeModel({
      content: [text("Prueba con 1,5.")],
      stop_reason: "end_turn",
    });
    const answers = { ...request.answers, orbit: "fast-sideways" };

    await runTutor(model, "modelo", { ...request, stepId: "orbit", answers });

    expect(model.mock.calls[0][0].tools).toEqual([]);
    expect(JSON.stringify(model.mock.calls[0][0].messages)).toContain(
      "Lanzamiento preparado: velocidad 0,7",
    );
  });

  it("no revela el resultado del lanzamiento antes de responder", async () => {
    const model = fakeModel({
      content: [text("¿Tú qué crees?")],
      stop_reason: "end_turn",
    });

    await runTutor(model, "modelo", { ...request, stepId: "orbit" });

    const sent = JSON.stringify(model.mock.calls[0][0].messages);
    expect(sent).toContain("aún bloqueado");
    expect(sent).not.toContain("Choque");
  });

  it("incluye el perfil derivado en el bloque de estado", async () => {
    const model = fakeModel({
      content: [text("Respuesta")],
      stop_reason: "end_turn",
    });

    await runTutor(model, "modelo", request);

    const sent = JSON.stringify(model.mock.calls[0][0].messages);
    expect(sent).toContain("Demostrado: Atracción mutua.");
    expect(sent).toContain("Por reforzar: Distancia.");
    expect(sent).toContain("proporción directa a la distancia");
    expect(sent).toContain("Sin responder: Masa, Caer sin llegar.");
  });

  it("separa el texto de la persona del bloque de estado", async () => {
    const model = fakeModel({
      content: [text("Respuesta")],
      stop_reason: "end_turn",
    });

    await runTutor(model, "modelo", request);

    const [params] = model.mock.calls[0];
    expect(params.messages.at(-1)?.content).toEqual([
      expect.objectContaining({
        text: expect.stringContaining("Estado de la app"),
      }),
      { type: "text", text: "Enséñame la distancia" },
    ]);
  });
});
