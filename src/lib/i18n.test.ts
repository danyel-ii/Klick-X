import { describe, expect, it, vi } from "vitest";
import { detectLocale, dictionaries } from "./i18n";

describe("i18n", () => {
  it("contains primary English and German navigation copy", () => {
    expect(dictionaries.en.nav.today).toBe("Today");
    expect(dictionaries.de.nav.today).toBe("Heute");
  });

  it("detects German browser locale", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(detectLocale()).toBe("de");
    vi.unstubAllGlobals();
  });
});
