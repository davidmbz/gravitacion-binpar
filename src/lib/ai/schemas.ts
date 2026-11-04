import { z } from "zod";
import { SCENE_LIMITS } from "@/features/learn/scene";
import { STEPS } from "@/features/learn/steps";
import { LAUNCH_LIMITS } from "@/lib/physics/moon-launch";

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

export const launchSchema = z.strictObject({
  speed: z.number().min(LAUNCH_LIMITS.speed.min).max(LAUNCH_LIMITS.speed.max),
  angle: z.number().min(LAUNCH_LIMITS.angle.min).max(LAUNCH_LIMITS.angle.max),
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

const answerSchema = z.string().max(40).nullable();

export const tutorRequestSchema = z.strictObject({
  messages: z
    .array(messageSchema)
    .min(1)
    .max(TUTOR_LIMITS.messages)
    .refine((messages) => messages.at(-1)?.role === "user", {
      error: "El último mensaje debe ser de la persona",
    }),
  scene: sceneSchema,
  launch: launchSchema,
  stepId: z.enum(["attraction", "mass", "distance", "orbit"]),
  /** Solo identificadores: el servidor deriva el perfil, no lo recibe hecho. */
  answers: z
    .strictObject({
      attraction: answerSchema,
      mass: answerSchema,
      distance: answerSchema,
      orbit: answerSchema,
    })
    .refine(
      (answers) =>
        STEPS.every(
          ({ id, options }) =>
            answers[id] === null ||
            options.some((option) => option.id === answers[id]),
        ),
      { error: "Una respuesta no pertenece a su paso" },
    ),
});

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
