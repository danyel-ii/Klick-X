import type { StudyBlock } from "./types";

function hasWorkedNote(block: StudyBlock) {
  return Boolean(block.note?.trim()) && (block.elapsedSeconds > 0 || block.status === "completed" || Boolean(block.completedAt));
}

function isBeforeBlock(candidate: StudyBlock, current: StudyBlock) {
  if (candidate.date !== current.date) return candidate.date < current.date;
  if (candidate.index !== current.index) return candidate.index < current.index;
  return candidate.updatedAt < current.updatedAt;
}

export function findPreviousSubjectNote(current: StudyBlock, blocks: StudyBlock[]) {
  return blocks
    .filter((block) => block.id !== current.id && block.subjectId === current.subjectId && hasWorkedNote(block) && isBeforeBlock(block, current))
    .sort((a, b) => b.date.localeCompare(a.date) || b.index - a.index || b.updatedAt.localeCompare(a.updatedAt))[0];
}
