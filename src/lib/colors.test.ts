import { describe, expect, it } from "vitest";
import { resolveTagColor, resolveTagTextColor, tagThemeColorValues } from "./colors";

describe("colors", () => {
  it("maps legacy default tag colors to DaisyUI theme tokens", () => {
    expect(resolveTagColor("#be123c")).toBe("var(--color-error)");
    expect(resolveTagColor("#9333ea")).toBe("var(--color-secondary)");
    expect(resolveTagColor("#0d9488")).toBe("var(--color-success)");
    expect(resolveTagColor("#2563eb")).toBe("var(--color-primary)");
    expect(resolveTagColor("#ca8a04")).toBe("var(--color-warning)");
  });

  it("uses DaisyUI content tokens for theme-aware tag text", () => {
    expect(tagThemeColorValues).toContain("var(--color-primary)");
    expect(resolveTagTextColor("var(--color-primary)")).toBe("var(--color-primary-content)");
  });
});
