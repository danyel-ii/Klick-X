import { describe, expect, it } from "vitest";
import { resolveSubjectColor, resolveSubjectTextColor, resolveTagColor, resolveTagTextColor, subjectColorValues, tagThemeColorValues } from "./colors";

describe("colors", () => {
  it("maps legacy subject colors to DaisyUI theme tokens", () => {
    expect(resolveSubjectColor("#2563eb")).toBe("var(--color-primary)");
    expect(resolveSubjectColor("#7c3aed")).toBe("var(--color-secondary)");
    expect(resolveSubjectColor("#0891b2")).toBe("var(--color-info)");
    expect(resolveSubjectColor("#16a34a")).toBe("var(--color-success)");
  });

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
    expect(resolveSubjectTextColor("var(--color-primary)")).toBe("var(--color-primary-content)");
  });

  it("keeps arbitrary subject and tag colors inside the DaisyUI role palette", () => {
    expect(subjectColorValues).toContain(resolveSubjectColor("#123456"));
    expect(subjectColorValues).toContain(resolveSubjectColor("hotpink"));
    expect(tagThemeColorValues).toContain(resolveTagColor("#123456"));
    expect(tagThemeColorValues).toContain(resolveTagColor("hotpink"));
  });
});
