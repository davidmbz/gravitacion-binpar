import { describe, expect, it } from "vitest";
import { TUTOR_LIMITS } from "@/lib/ai/schemas";
import {
  chatReducer,
  INITIAL_CHAT_STATE,
  isConversationFull,
  type ChatMessage,
} from "./tutor-chat";

describe("chatReducer", () => {
  it("añade la pregunta y espera respuesta", () => {
    const state = chatReducer(INITIAL_CHAT_STATE, {
      type: "sent",
      content: "Hola",
    });
    expect(state.messages).toEqual([{ role: "user", content: "Hola" }]);
    expect(state.phase).toEqual({ status: "sending" });
  });

  it("añade la respuesta y vuelve a reposo", () => {
    const sent = chatReducer(INITIAL_CHAT_STATE, {
      type: "sent",
      content: "Hola",
    });
    const state = chatReducer(sent, { type: "replied", content: "Buenas" });
    expect(state.messages).toHaveLength(2);
    expect(state.phase).toEqual({ status: "idle" });
  });

  it("retira la pregunta fallida y muestra el error", () => {
    const sent = chatReducer(INITIAL_CHAT_STATE, {
      type: "sent",
      content: "Hola",
    });
    const state = chatReducer(sent, {
      type: "failed",
      message: "Sin servicio",
    });
    expect(state.messages).toEqual([]);
    expect(state.phase).toEqual({ status: "error", message: "Sin servicio" });
  });
});

describe("isConversationFull", () => {
  it("avisa al alcanzar el límite del servidor", () => {
    const message: ChatMessage = { role: "user", content: "a" };
    const full = Array.from({ length: TUTOR_LIMITS.messages }, () => message);
    expect(isConversationFull(full)).toBe(true);
    expect(isConversationFull(full.slice(1))).toBe(false);
  });
});
