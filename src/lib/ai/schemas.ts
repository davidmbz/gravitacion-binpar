import { z } from "zod";
import { SCENE_LIMITS } from "@/features/learn/scene";
import { STEPS } from "@/features/learn/steps";

/** Cada límite acota el coste de una petición. El README detalla qué no protegen. */
export const TUTOR_LIMITS = {
  bodyBytes: 32_000,
  userMessageChars: 600,
  assistantMessageChars: 4_000,
  messages: 20,
} as const;

const massSchema = z
  .number()
  .int()
  .min(SCENE_LIMITS.mass.min)
  .max(SCENE_LIMITS.mass.max);

export const sceneSchema = z.strictObject({
  massA: massSchema,
  massB: massSchema,
  distance: z
    .number()
    .int()
    .min(SCENE_LIMITS.distance.min)
    .max(SCENE_LIMITS.distance.max),
});

const messageSchema = z.discriminatedUnion("role", [
  z.strictObject({
    role: z.literal("user"),
    content: z.string().trim().min(1).max(TUTOR_LIMITS.userMessageChars),
  }),
  z.strictObject({
    role: z.literal("assistant"),
    content: z.string().min(1).max(TUTOR_LIMITS.assistantMessageChars),
  }),
]);

export const tutorRequestSchema = z
  .strictObject({
    messages: z
      .array(messageSchema)
      .min(1)
      .max(TUTOR_LIMITS.messages)
      .refine((messages) => messages.at(-1)?.role === "user", {
        error: "El último mensaje debe ser de la persona",
      }),
    scene: sceneSchema,
    stepId: z.enum(["attraction", "mass", "distance"]),
    /** Opción elegida en la predicción del paso, o null si sigue pendiente. */
    answerId: z.string().max(40).nullable(),
  })
  .refine(
    ({ stepId, answerId }) =>
      answerId === null ||
      STEPS.some(
        ({ id, options }) =>
          id === stepId && options.some((option) => option.id === answerId),
      ),
    { error: "La opción no pertenece a este paso" },
  );

export type TutorRequest = z.infer<typeof tutorRequestSchema>;

export const tutorResponseSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("ok"),
    reply: z.string(),
    scene: sceneSchema.nullable(),
  }),
  z.strictObject({
    status: z.literal("error"),
    message: z.string(),
  }),
]);

export type TutorResponse = z.infer<typeof tutorResponseSchema>;
