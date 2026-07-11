import { describe, expect, it } from "vitest";
import {
  artworkStepCount,
  buildDailyFractal,
  buildFractalParams,
  calculateArtworkProgress,
  compactDailyFractal,
  generateFractalConfig,
  generateLegacyCoinPartitionArtwork,
  materializeDailyFractalArtwork,
  nextArtworkCompletionOffset,
} from "./fractals";
import type { StudyBlock, Subject, Tag } from "./types";

const now = "2026-05-22T12:00:00.000Z";
const subject: Subject = {
  id: "subject_math",
  name: "Mathematics",
  color: "var(--color-primary)",
  icon: "",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};
const tag: Tag = {
  id: "tag_focus",
  name: "Deep focus",
  color: "var(--color-secondary)",
  description: "",
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

function block(date: string, index: number, status: StudyBlock["status"] = "completed", completedAt = `${date}T12:00:00.000Z`): StudyBlock {
  return {
    id: `block_${date}_${index}`,
    dayId: `day_${date}`,
    date,
    index,
    subjectId: subject.id,
    tagIds: [tag.id],
    status,
    plannedMinutes: 30,
    elapsedSeconds: status === "completed" ? 1800 : 0,
    startedAt: null,
    completedAt: status === "completed" ? completedAt : null,
    note: "",
    createdAt: `${date}T11:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe("daily fractals", () => {
  it("builds deterministic config from study streak inputs", () => {
    const blocks = [block("2026-05-20", 0), block("2026-05-22", 0), block("2026-05-22", 1)];
    const params = buildFractalParams({ date: "2026-05-22", blocks, subjects: [subject], tags: [tag] });
    const first = generateFractalConfig(params);
    const second = generateFractalConfig(params);

    expect(params.completedBlocksToday).toBe(2);
    expect(params.daysSinceLastUse).toBe(1);
    expect(params.subjectStreaks[subject.id]).toBe(1);
    expect(params.tagStreaks[tag.id]).toBe(1);
    expect(params.seed).toContain("streak-1");
    expect(second).toEqual(first);
    expect(first.artwork?.lineCount).toBe(artworkStepCount);
    expect(first.artwork?.faces).toHaveLength(artworkStepCount);
    expect(first.artwork?.faces[0]?.hatchSegments.length).toBeGreaterThan(0);
  });

  it("preserves the artwork identity while evolving visible progress", () => {
    const first = buildDailyFractal({ date: "2026-05-22", blocks: [block("2026-05-22", 0)], subjects: [subject], tags: [tag], now });
    const next = buildDailyFractal({
      existing: first,
      date: "2026-05-22",
      blocks: [block("2026-05-22", 0), block("2026-05-22", 1)],
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T13:00:00.000Z",
    });

    expect(next.id).toBe(first.id);
    expect(next.createdAt).toBe(first.createdAt);
    expect(next.updatedAt).toBe("2026-05-22T13:00:00.000Z");
    expect(next.config.artwork?.lineCount).toBe(artworkStepCount);
    expect(next.config).toEqual(first.config);
    expect(next.generatorVersion).toBe(2);
    expect(next.visibleSteps).toBeGreaterThan(first.visibleSteps ?? 0);
  });

  it("reconciles a completion that arrives earlier than a concurrent artwork creator", () => {
    const later = block("2026-05-22", 1, "completed", "2026-05-22T13:00:00.000Z");
    const first = buildDailyFractal({ date: "2026-05-22", blocks: [later], subjects: [subject], tags: [tag], now: later.completedAt! });
    const earlier = block("2026-05-22", 0, "completed", "2026-05-22T12:00:00.000Z");
    const reconciled = buildDailyFractal({
      existing: first,
      date: "2026-05-22",
      blocks: [later, earlier],
      subjects: [subject],
      tags: [tag],
      now: earlier.completedAt!,
    });

    expect(first).toMatchObject({ visibleSteps: 1, completionOffset: 0, completionCount: 1 });
    expect(reconciled).toMatchObject({ visibleSteps: 2, completionOffset: 0, completionCount: 2 });
    expect(reconciled.updatedAt).toBe(first.updatedAt);
  });

  it("counts every visible completion when a later request creates the first artwork", () => {
    const earlier = block("2026-05-22", 0, "completed", "2026-05-22T12:00:00.000Z");
    const later = block("2026-05-22", 1, "completed", "2026-05-22T13:00:00.000Z");
    const first = buildDailyFractal({
      date: "2026-05-22",
      blocks: [earlier, later],
      subjects: [subject],
      tags: [tag],
      now: later.completedAt!,
      completionOffset: 0,
    });

    expect(first).toMatchObject({ visibleSteps: 2, completionOffset: 0, completionCount: 2 });
  });

  it("can omit persisted geometry and reconstruct the same artwork from its seed", () => {
    const fractal = buildDailyFractal({ date: "2026-05-22", blocks: [block("2026-05-22", 0)], subjects: [subject], tags: [tag], now });
    const compact = compactDailyFractal(fractal);

    expect(compact.config.artwork).toBeUndefined();
    expect(materializeDailyFractalArtwork(compact)).toEqual(fractal.config.artwork);
  });

  it("reconstructs compact legacy artwork with the legacy algorithm", () => {
    const fractal = buildDailyFractal({ date: "2026-05-22", blocks: [block("2026-05-22", 0)], subjects: [subject], tags: [tag], now });
    const legacyArtwork = generateLegacyCoinPartitionArtwork(fractal.seed);
    const legacy = compactDailyFractal({ ...fractal, generatorVersion: undefined, config: { ...fractal.config, artwork: legacyArtwork } });

    expect(materializeDailyFractalArtwork(legacy)).toEqual(legacyArtwork);
  });

  it("advances one step per completed block and reverts one step for each completed missed day", () => {
    const progress = calculateArtworkProgress({
      startDate: "2026-05-20",
      asOfDate: "2026-05-24",
      blocks: [block("2026-05-20", 0), block("2026-05-20", 1), block("2026-05-22", 0)],
    });

    expect(progress.visibleSteps).toBe(1);
    expect(progress.completedAt).toBeNull();
  });

  it("does not subtract a step for the current day before that day has ended", () => {
    const progress = calculateArtworkProgress({
      startDate: "2026-05-20",
      asOfDate: "2026-05-23",
      blocks: [block("2026-05-20", 0), block("2026-05-22", 0)],
    });

    expect(progress.visibleSteps).toBe(1);
  });

  it("does not subtract a feature for a day with elapsed study", () => {
    const studiedWithoutCompletion = { ...block("2026-05-21", 0, "paused"), elapsedSeconds: 300 };
    const progress = calculateArtworkProgress({
      startDate: "2026-05-20",
      asOfDate: "2026-05-22",
      blocks: [block("2026-05-20", 0), studiedWithoutCompletion],
    });

    expect(progress.visibleSteps).toBe(1);
  });

  it("does not subtract a feature for an active timer spanning midnight", () => {
    const activeOvernight = {
      ...block("2026-05-21", 0, "active"),
      elapsedSeconds: 0,
      startedAt: "2026-05-21T23:55:00.000Z",
    };
    const progress = calculateArtworkProgress({
      startDate: "2026-05-20",
      asOfDate: "2026-05-22",
      blocks: [block("2026-05-20", 0), activeOvernight],
    });

    expect(progress.visibleSteps).toBe(1);
  });

  it("subtracts exactly once per missed calendar day across daylight-saving changes", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "Europe/Berlin";
    try {
      const progress = calculateArtworkProgress({
        startDate: "2026-10-24",
        asOfDate: "2026-10-27",
        blocks: [block("2026-10-24", 0), block("2026-10-24", 1), block("2026-10-24", 2)],
      });

      expect(progress.visibleSteps).toBe(1);
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    }
  });

  it("starts a same-day rollover artwork from the next completed block", () => {
    const previousBlocks = Array.from({ length: artworkStepCount }, (_, index) => block("2026-05-22", index, "completed", "2026-05-22T12:00:00.000Z"));
    const firstNewBlock = block("2026-05-22", artworkStepCount, "completed", "2026-05-22T15:00:00.000Z");
    const next = buildDailyFractal({
      date: "2026-05-22",
      blocks: [...previousBlocks, firstNewBlock],
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T15:00:00.000Z",
    });

    expect(next.visibleSteps).toBe(1);
    expect(next.status).toBe("active");
    expect(next.stats?.completedBlocks).toBe(1);
  });

  it("assigns concurrent rollover overflow to the next artwork exactly once", () => {
    const completedBlocks = Array.from({ length: artworkStepCount + 1 }, (_, index) =>
      block("2026-05-22", index, "completed", `2026-05-22T12:${String(index).padStart(2, "0")}:00.000Z`),
    );
    const active = buildDailyFractal({
      date: "2026-05-22",
      blocks: completedBlocks.slice(0, artworkStepCount - 1),
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T12:22:00.000Z",
      completionOffset: 0,
    });
    const completed = buildDailyFractal({
      existing: active,
      date: "2026-05-22",
      blocks: completedBlocks,
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T12:24:00.000Z",
    });
    const offset = nextArtworkCompletionOffset([completed], completedBlocks);
    const rollover = buildDailyFractal({
      date: "2026-05-22",
      blocks: completedBlocks,
      subjects: [subject],
      tags: [tag],
      now: "2026-05-22T12:24:00.000Z",
      completionOffset: offset,
    });

    expect(completed).toMatchObject({ status: "completed", completionCount: artworkStepCount });
    expect(offset).toBe(artworkStepCount);
    expect(rollover).toMatchObject({ status: "active", visibleSteps: 1, completionOffset: artworkStepCount, completionCount: 1 });
  });
});
