import { describe, expect, it } from "vitest";
import { daisyThemes, formatThemeName, isDaisyTheme } from "./themes";

describe("themes", () => {
  it("exposes the full DaisyUI theme suite used by settings", () => {
    expect(daisyThemes).toEqual([
      "light",
      "dark",
      "cupcake",
      "bumblebee",
      "emerald",
      "corporate",
      "synthwave",
      "retro",
      "cyberpunk",
      "valentine",
      "halloween",
      "garden",
      "forest",
      "aqua",
      "lofi",
      "pastel",
      "fantasy",
      "wireframe",
      "black",
      "luxury",
      "dracula",
      "cmyk",
      "autumn",
      "business",
      "acid",
      "lemonade",
      "night",
      "coffee",
      "winter",
      "dim",
      "nord",
      "sunset",
      "caramellatte",
      "abyss",
      "silk",
    ]);
  });

  it("validates and formats theme names", () => {
    expect(isDaisyTheme("dracula")).toBe(true);
    expect(isDaisyTheme("system")).toBe(false);
    expect(formatThemeName("cmyk")).toBe("CMYK");
    expect(formatThemeName("caramellatte")).toBe("Caramellatte");
  });
});
