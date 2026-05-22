import { beforeEach, describe, expect, it } from "vitest";
import { createAuthToken, validateCredentials, verifyAuthToken } from "./auth";

describe("auth", () => {
  beforeEach(() => {
    process.env.STUDY_BLOCKS_USER_ID = "danyel-ii";
    process.env.STUDY_BLOCKS_PASSWORD = "test-password";
    process.env.STUDY_BLOCKS_AUTH_SECRET = "test-auth-secret";
  });

  it("validates the configured single-user credentials", () => {
    expect(validateCredentials("danyel-ii", "test-password")).toBe(true);
    expect(validateCredentials("danyel-ii", "wrong-password")).toBe(false);
  });

  it("creates and verifies a signed session token", async () => {
    const now = Date.UTC(2026, 4, 22);
    const token = await createAuthToken(now);
    await expect(verifyAuthToken(token, now + 1000)).resolves.toBe(true);
    await expect(verifyAuthToken(`${token}tampered`, now + 1000)).resolves.toBe(false);
  });

  it("rejects expired session tokens", async () => {
    const now = Date.UTC(2026, 4, 22);
    const token = await createAuthToken(now);
    await expect(verifyAuthToken(token, now + 31 * 24 * 60 * 60 * 1000)).resolves.toBe(false);
  });

  it("treats malformed session tokens as unauthenticated instead of throwing", async () => {
    await expect(verifyAuthToken("not-base64.%%%")).resolves.toBe(false);
    await expect(verifyAuthToken("only-one-part")).resolves.toBe(false);
  });
});
