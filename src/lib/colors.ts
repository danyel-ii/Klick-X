export const subjectColorOptions = [
  { value: "#2563eb", label: "Blue" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#0891b2", label: "Cyan" },
  { value: "#16a34a", label: "Green" },
  { value: "#dc2626", label: "Red" },
  { value: "#d97706", label: "Amber" },
  { value: "#0f766e", label: "Teal" },
  { value: "#4f46e5", label: "Indigo" },
] as const;

export const tagThemeColorOptions = [
  { value: "var(--color-primary)", content: "var(--color-primary-content)", label: "Primary" },
  { value: "var(--color-secondary)", content: "var(--color-secondary-content)", label: "Secondary" },
  { value: "var(--color-accent)", content: "var(--color-accent-content)", label: "Accent" },
  { value: "var(--color-info)", content: "var(--color-info-content)", label: "Info" },
  { value: "var(--color-success)", content: "var(--color-success-content)", label: "Success" },
  { value: "var(--color-warning)", content: "var(--color-warning-content)", label: "Warning" },
  { value: "var(--color-error)", content: "var(--color-error-content)", label: "Error" },
  { value: "var(--color-neutral)", content: "var(--color-neutral-content)", label: "Neutral" },
] as const;

export const subjectColorValues = subjectColorOptions.map((option) => option.value);
export const tagThemeColorValues = tagThemeColorOptions.map((option) => option.value);

export const defaultTagColorValues = [
  "var(--color-error)",
  "var(--color-secondary)",
  "var(--color-success)",
  "var(--color-primary)",
  "var(--color-warning)",
] as const;

const legacyTagColorMap = new Map([
  ["#be123c", "var(--color-error)"],
  ["#9333ea", "var(--color-secondary)"],
  ["#0d9488", "var(--color-success)"],
  ["#2563eb", "var(--color-primary)"],
  ["#ca8a04", "var(--color-warning)"],
]);

function normalizeColor(color?: string | null) {
  return color?.trim().toLowerCase() ?? "";
}

function fallbackThemeColor(color: string) {
  if (!color) return tagThemeColorValues[0];
  const hash = [...color].reduce((total, character) => total + character.charCodeAt(0), 0);
  return tagThemeColorValues[hash % tagThemeColorValues.length];
}

export function resolveTagColor(color?: string | null) {
  const normalized = normalizeColor(color);
  const trimmed = color?.trim() ?? "";
  if (legacyTagColorMap.has(normalized)) return legacyTagColorMap.get(normalized) ?? tagThemeColorValues[0];
  if (tagThemeColorValues.includes(trimmed as (typeof tagThemeColorValues)[number])) return trimmed;
  return fallbackThemeColor(normalized);
}

export function readableTextColor(color: string) {
  const hex = color.trim().replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

export function resolveTagTextColor(color?: string | null) {
  const resolved = resolveTagColor(color);
  return tagThemeColorOptions.find((option) => option.value === resolved)?.content ?? readableTextColor(resolved);
}
