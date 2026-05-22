export const daisyThemes = [
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
] as const;

export type DaisyTheme = (typeof daisyThemes)[number];
export type AppTheme = "system" | DaisyTheme;

const daisyThemeSet = new Set<string>(daisyThemes);

export function isDaisyTheme(theme: string): theme is DaisyTheme {
  return daisyThemeSet.has(theme);
}

export function formatThemeName(theme: DaisyTheme) {
  if (theme === "cmyk") return "CMYK";
  return theme
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
