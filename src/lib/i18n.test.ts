import { describe, expect, it, vi } from "vitest";
import { detectLocale, dictionaries } from "./i18n";

describe("i18n", () => {
  it("contains primary English and German navigation copy", () => {
    expect(dictionaries.en.nav.today).toBe("Today");
    expect(dictionaries.de.nav.today).toBe("Heute");
  });

  it("contains Android install prompt copy", () => {
    expect(dictionaries.en.install.action).toBe("Install app");
    expect(dictionaries.de.install.action).toBe("App installieren");
  });

  it("contains login copy", () => {
    expect(dictionaries.en.login.submit).toBe("Sign in");
    expect(dictionaries.de.login.submit).toBe("Anmelden");
  });

  it("detects German browser locale", () => {
    vi.stubGlobal("navigator", { language: "de-DE" });
    expect(detectLocale()).toBe("de");
    vi.unstubAllGlobals();
  });
});
