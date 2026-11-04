import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_SCENE } from "@/features/learn/scene";
import { TUTOR_LIMITS } from "@/lib/ai/schemas";
import { POST } from "./route";

const validBody = JSON.stringify({
  messages: [{ role: "user", content: "Hola" }],
  scene: INITIAL_SCENE,
  stepId: "mass",
  answerId: null,
});

function post(body: string, ip: string): Request {
  return new Request("http://localhost/api/tutor", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body,
  });
}

describe("POST /api/tutor", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("ANTHROPIC_MODEL", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("responde 503 con un error claro si falta la clave", async () => {
    const response = await POST(post(validBody, "ip-503"));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ status: "error" });
  });

  it("rechaza un JSON inválido con 400", async () => {
    const response = await POST(post("{no es json", "ip-400"));
    expect(response.status).toBe(400);
  });

  it("rechaza una escena fuera de límites con 400", async () => {
    const body = JSON.stringify({
      ...JSON.parse(validBody),
      scene: { massA: 999, massB: 1, distance: 1 },
    });
    const response = await POST(post(body, "ip-scene"));
    expect(response.status).toBe(400);
  });

  it("rechaza un cuerpo demasiado grande con 413", async () => {
    const body = "a".repeat(TUTOR_LIMITS.bodyBytes + 1);
    const response = await POST(post(body, "ip-413"));
    expect(response.status).toBe(413);
  });

  it("limita la frecuencia por IP con 429", async () => {
    for (let i = 0; i < 10; i++) await POST(post(validBody, "ip-429"));
    const response = await POST(post(validBody, "ip-429"));
    expect(response.status).toBe(429);
  });
});
