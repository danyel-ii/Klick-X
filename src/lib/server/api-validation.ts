import { isDaisyTheme } from "@/lib/themes";
import type { DayAssignment, StatsFilters } from "@/lib/types";

export class ApiValidationError extends Error {}

function fail(field: string): never {
  throw new ApiValidationError(`Invalid request payload: ${field}.`);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(field);
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number, allowEmpty = false) {
  if (typeof value !== "string" || value.length > max || (!allowEmpty && !value.trim())) fail(field);
  return allowEmpty ? value : value.trim();
}

function id(value: unknown, field = "id") {
  return text(value, field, 160);
}

function boolean(value: unknown, field: string) {
  if (typeof value !== "boolean") fail(field);
  return value;
}

function integer(value: unknown, field: string, min: number, max: number) {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) fail(field);
  return value as number;
}

function date(value: unknown, field = "date") {
  const candidate = text(value, field, 10);
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate) fail(field);
  return candidate;
}

function tagIds(value: unknown) {
  if (!Array.isArray(value) || value.length > 50) fail("tagIds");
  return [...new Set(value.map((item) => id(item, "tagId")))];
}

function assignment(value: unknown): DayAssignment {
  const item = record(value, "assignment");
  return { subjectId: id(item.subjectId, "subjectId"), tagIds: tagIds(item.tagIds) };
}

function defined(values: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function settingsPatch(value: unknown) {
  const item = record(value, "patch");
  const allowed = new Set(["blockMinutes", "theme", "locale", "startOfWeek", "screensaverEnabled", "screensaverDelaySeconds", "notificationsEnabled", "timerBeepEnabled"]);
  if (Object.keys(item).some((key) => !allowed.has(key))) fail("patch");
  const next: Record<string, unknown> = {};
  if (item.blockMinutes !== undefined) next.blockMinutes = integer(item.blockMinutes, "blockMinutes", 1, 240);
  if (item.theme !== undefined) {
    if (item.theme !== "system" && (typeof item.theme !== "string" || !isDaisyTheme(item.theme))) fail("theme");
    next.theme = item.theme;
  }
  if (item.locale !== undefined) {
    if (item.locale !== "en" && item.locale !== "de") fail("locale");
    next.locale = item.locale;
  }
  if (item.startOfWeek !== undefined) {
    if (item.startOfWeek !== "monday" && item.startOfWeek !== "sunday") fail("startOfWeek");
    next.startOfWeek = item.startOfWeek;
  }
  if (item.screensaverEnabled !== undefined) next.screensaverEnabled = boolean(item.screensaverEnabled, "screensaverEnabled");
  if (item.screensaverDelaySeconds !== undefined) next.screensaverDelaySeconds = integer(item.screensaverDelaySeconds, "screensaverDelaySeconds", 30, 3600);
  if (item.notificationsEnabled !== undefined) next.notificationsEnabled = boolean(item.notificationsEnabled, "notificationsEnabled");
  if (item.timerBeepEnabled !== undefined) next.timerBeepEnabled = boolean(item.timerBeepEnabled, "timerBeepEnabled");
  return next;
}

export function validateStatsFilters(value: unknown): StatsFilters {
  const item = record(value, "filters");
  if (!new Set(["7d", "30d", "90d", "all"]).has(String(item.range))) fail("range");
  return {
    range: item.range as StatsFilters["range"],
    subjectId: item.subjectId === undefined ? undefined : id(item.subjectId, "subjectId"),
    tagId: item.tagId === undefined ? undefined : id(item.tagId, "tagId"),
    noteQuery: item.noteQuery === undefined ? undefined : text(item.noteQuery, "noteQuery", 200, true),
  };
}

export function validateAction(value: unknown) {
  const body = record(value, "body");
  const action = text(body.action, "action", 60);
  const payload = body.payload === undefined ? {} : record(body.payload, "payload");
  const idOnly = () => ({ id: id(payload.id) });

  switch (action) {
    case "setLocale":
      if (payload.locale !== "en" && payload.locale !== "de") fail("locale");
      return { action, payload: { locale: payload.locale } };
    case "updateSettings": return { action, payload: { patch: settingsPatch(payload.patch) } };
    case "completeOnboarding": case "resetOnboarding": return { action, payload: {} };
    case "createSubject": {
      const input = record(payload.input, "input");
      return { action, payload: { input: { name: text(input.name, "name", 120), color: text(input.color, "color", 180), icon: input.icon === undefined ? undefined : text(input.icon, "icon", 80, true) } } };
    }
    case "updateSubject": {
      const input = record(payload.input, "input");
      return { action, payload: { id: id(payload.id), input: defined({ name: input.name === undefined ? undefined : text(input.name, "name", 120), color: input.color === undefined ? undefined : text(input.color, "color", 180), icon: input.icon === undefined ? undefined : text(input.icon, "icon", 80, true) }) } };
    }
    case "createTag": {
      const input = record(payload.input, "input");
      return { action, payload: { input: { name: text(input.name, "name", 120), color: text(input.color, "color", 180), description: input.description === undefined ? undefined : text(input.description, "description", 600, true) } } };
    }
    case "updateTag": {
      const input = record(payload.input, "input");
      return { action, payload: { id: id(payload.id), input: defined({ name: input.name === undefined ? undefined : text(input.name, "name", 120), color: input.color === undefined ? undefined : text(input.color, "color", 180), description: input.description === undefined ? undefined : text(input.description, "description", 600, true) }) } };
    }
    case "archiveSubject": case "restoreSubject": case "archiveTag": case "restoreTag": case "deleteBlock": case "startBlock": case "pauseBlock": case "completeBlock": case "skipBlock": return { action, payload: idOnly() };
    case "deleteSubject": case "deleteTag": return { action, payload: { ...idOnly(), force: payload.force === undefined ? false : boolean(payload.force, "force") } };
    case "createOrUpdateDayPlan": {
      if (!Array.isArray(payload.assignments) || payload.assignments.length > 96) fail("assignments");
      const assignments = payload.assignments.map(assignment);
      return { action, payload: { date: date(payload.date), plannedBlockCount: integer(payload.plannedBlockCount, "plannedBlockCount", 0, 96), assignments } };
    }
    case "addBlockToDay": return { action, payload: { date: date(payload.date), input: assignment(payload.input) } };
    case "updateBlockSubject": return { action, payload: { id: id(payload.id), subjectId: id(payload.subjectId, "subjectId") } };
    case "updateBlockTags": return { action, payload: { id: id(payload.id), tagIds: tagIds(payload.tagIds) } };
    case "updateBlockNote": return { action, payload: { id: id(payload.id), note: text(payload.note, "note", 10000, true) } };
    case "importLocalData": return { action, payload: { payload: payload.payload } };
    case "resetLocalData": return { action, payload: { confirm: text(payload.confirm, "confirm", 5) } };
    default: throw new ApiValidationError("Unknown action.");
  }
}
