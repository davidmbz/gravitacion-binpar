import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { failureFromError } from "./errors";

const headers = new Headers();

describe("failureFromError", () => {
  it("traduce el límite del proveedor a 429", () => {
    const error = new Anthropic.RateLimitError(429, {}, "límite", headers);
    expect(failureFromError(error).httpStatus).toBe(429);
  });

  it("distingue el tiempo agotado", () => {
    const error = new Anthropic.APIConnectionTimeoutError();
    expect(failureFromError(error).httpStatus).toBe(504);
  });

  it("no expone detalles de una clave inválida", () => {
    const error = new Anthropic.AuthenticationError(401, {}, "key", headers);
    const failure = failureFromError(error);
    expect(failure.httpStatus).toBe(503);
    expect(failure.message).not.toContain("key");
  });

  it("deja pasar los errores que no son del proveedor", () => {
    const bug = new TypeError("fallo de programación");
    expect(() => failureFromError(bug)).toThrow(bug);
  });
});
