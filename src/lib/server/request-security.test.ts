import { describe, expect, it } from "vitest";
import { assertSameOrigin, readJsonBody, RequestSecurityError } from "./request-security";

describe("request security", () => {
  it("rejects cross-origin mutation requests", () => {
    const request = new Request("https://app.example/api/study", { headers: { origin: "https://evil.example" } });
    expect(() => assertSameOrigin(request)).toThrowError(RequestSecurityError);
  });

  it("accepts same-origin and non-browser requests", () => {
    expect(() => assertSameOrigin(new Request("https://app.example/api/study", { headers: { origin: "https://app.example" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("https://app.example/api/study"))).not.toThrow();
  });

  it("enforces JSON content type and actual body size", async () => {
    await expect(readJsonBody(new Request("https://app.example/api/study", { method: "POST", body: "{}" }), 100)).rejects.toMatchObject({ status: 415 });
    await expect(
      readJsonBody(new Request("https://app.example/api/study", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: "oversized" }) }), 8),
    ).rejects.toMatchObject({ status: 413 });
  });
});
