import type { StudyBlock } from "./types";

export function secondsSince(startedAt: string, now = new Date()) {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
}

export function visibleElapsedSeconds(block: StudyBlock, now = new Date()) {
  if (block.status === "active" && block.startedAt) {
    return block.elapsedSeconds + secondsSince(block.startedAt, now);
  }
  return block.elapsedSeconds;
}

export function accumulateElapsed(block: StudyBlock, now = new Date()) {
  return block.startedAt ? block.elapsedSeconds + secondsSince(block.startedAt, now) : block.elapsedSeconds;
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function formatMinutes(totalSeconds: number) {
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
