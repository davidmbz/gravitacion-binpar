"use client";

import { useReducer, useState, type FormEvent } from "react";
import { TUTOR_LIMITS } from "@/lib/ai/schemas";
import type { Launch } from "@/lib/physics/moon-launch";
import type { Answers } from "./learner-profile";
import type { Scene } from "./scene";
import type { StepId } from "./steps";
import {
  askTutor,
  chatReducer,
  INITIAL_CHAT_STATE,
  isConversationFull,
} from "./tutor-chat";

type TutorPanelProps = {
  stepId: StepId;
  /** Preguntas de un toque, según el momento del paso. */
  suggestions: readonly string[];
  answers: Answers;
  scene: Scene;
  launch: Launch;
  onSceneChange: (scene: Scene) => void;
};

export function TutorPanel({
  stepId,
  suggestions,
  answers,
  scene,
  launch,
  onSceneChange,
}: TutorPanelProps) {
  const [chat, dispatch] = useReducer(chatReducer, INITIAL_CHAT_STATE);
  const [draft, setDraft] = useState("");

  const isSending = chat.phase.status === "sending";
  const isFull = isConversationFull(chat.messages);

  async function send(content: string) {
    if (isSending || isFull) return;

    dispatch({ type: "sent", content });
    const response = await askTutor({
      messages: [...chat.messages, { role: "user", content }],
      scene,
      launch,
      stepId,
      answers,
    });

    if (response.status === "error") {
      dispatch({ type: "failed", message: response.message });
      return;
    }

    dispatch({ type: "replied", content: response.reply });
    // Una pregunta sugerida no debe borrar lo que se estaba escribiendo.
    setDraft((current) => (current.trim() === content ? "" : current));
    if (response.scene) onSceneChange(response.scene);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (content) void send(content);
  }

  return (
    <section
      aria-labelledby="tutor-title"
      className="border-t border-rule pt-4"
    >
      <h3 id="tutor-title" className="scroll-mt-60 text-xl lg:scroll-mt-6">
        Pregunta al tutor
      </h3>
      <p className="mt-1">
        Cuéntale lo que no te encaja. Puede mover la mesa para enseñártelo.
      </p>
      <p className="mt-1 text-ink-soft">
        Lo que escribas se envía a Anthropic, un proveedor externo, para generar
        la respuesta. No incluyas datos personales.
      </p>

      {chat.messages.length > 0 && (
        <ol role="log" aria-label="Conversación" className="mt-4 space-y-3">
          {chat.messages.map((message, index) => (
            <li
              key={index}
              className={
                message.role === "user"
                  ? "border-l-2 border-rule pl-3 text-ink-soft"
                  : "border-l-2 border-prussian pl-3"
              }
            >
              <span className="sr-only">
                {message.role === "user" ? "Tú: " : "Tutor: "}
              </span>
              {message.content}
            </li>
          ))}
        </ol>
      )}

      <p role="status" className="mt-3 italic empty:hidden">
        {isSending ? "El tutor está pensando" : ""}
      </p>

      {chat.phase.status === "error" && (
        <p role="alert" className="mt-3 text-cinnabar">
          {chat.phase.message}
        </p>
      )}

      {isFull ? (
        <div className="mt-3">
          <p>Has llegado al límite de esta conversación.</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "reset" })}
            className="mt-2 min-h-11 cursor-pointer border border-ink px-4 hover:bg-paper-deep"
          >
            Empezar otra conversación
          </button>
        </div>
      ) : (
        <>
          <ul aria-label="Preguntas sugeridas" className="mt-3 space-y-2">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => void send(suggestion)}
                  className="min-h-11 w-full cursor-pointer border border-rule px-3 py-2 text-left hover:border-ink disabled:cursor-not-allowed disabled:text-ink-soft"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmit} className="mt-3">
            <label htmlFor="tutor-question" className="block">
              Tu pregunta
            </label>
            <textarea
              id="tutor-question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={TUTOR_LIMITS.userMessageChars}
              rows={3}
              className="mt-1 w-full border border-ink-soft bg-paper p-2"
            />
            <button
              type="submit"
              disabled={isSending || draft.trim() === ""}
              className="mt-2 min-h-11 cursor-pointer bg-prussian px-5 text-paper disabled:cursor-not-allowed disabled:bg-paper-deep disabled:text-ink-soft"
            >
              Enviar pregunta
            </button>
          </form>
        </>
      )}
    </section>
  );
}
