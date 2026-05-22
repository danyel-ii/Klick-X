import { describe, expect, it } from "vitest";
import { clearFailedLogins, isLoginRateLimited, recordFailedLogin } from "./rate-limit";

describe("login rate limit", () => {
  it("limits repeated failed login attempts and can be cleared", () => {
    const key = "rate-limit-test";
    const now = Date.UTC(2026, 4, 22);
    clearFailedLogins(key);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(isLoginRateLimited(key, now)).toBe(false);
      recordFailedLogin(key, now);
    }

    expect(isLoginRateLimited(key, now)).toBe(true);
    clearFailedLogins(key);
    expect(isLoginRateLimited(key, now)).toBe(false);
  });
});
