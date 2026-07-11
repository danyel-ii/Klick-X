import type { DailyFractal } from "./types";

type UpdatedEntity = { updatedAt: string };

function structurallyEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => structurallyEqual(value, right[index]));
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).filter((key) => leftRecord[key] !== undefined);
  const rightKeys = Object.keys(rightRecord).filter((key) => rightRecord[key] !== undefined);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => Object.hasOwn(rightRecord, key) && structurallyEqual(leftRecord[key], rightRecord[key]));
}

export function hasSameDailyFractalContent(current: DailyFractal, next: DailyFractal) {
  const currentContent: Partial<DailyFractal> = { ...current };
  const nextContent: Partial<DailyFractal> = { ...next };
  delete currentContent.updatedAt;
  delete nextContent.updatedAt;
  return structurallyEqual(currentContent, nextContent);
}

export function isDailyFractalCurrent(current: DailyFractal, asOfDate: string, sources: UpdatedEntity[]) {
  return current.stats?.endDate === asOfDate && sources.every((source) => source.updatedAt <= current.updatedAt);
}
