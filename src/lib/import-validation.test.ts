import { describe, expect, it } from "vitest";
import { normalizeExportPayload } from "./import-validation";
import type { ExportPayload } from "./types";

const now = "2026-05-22T12:00:00.000Z";

function validPayload(): ExportPayload {
  return {
    version: 1,
    exportedAt: now,
    subjects: [
      {
        id: "subject_math",
        name: "Mathematics",
        color: "#2563eb",
        icon: "",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tags: [
      {
        id: "tag_focus",
        name: "Deep focus",
        color: "#2563eb",
        description: "Quiet mode",
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    studyDays: [
      {
        id: "day_2026_05_22",
        date: "2026-05-22",
        plannedBlockCount: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
    studyBlocks: [
      {
        id: "block_1",
        dayId: "day_2026_05_22",
        date: "2026-05-22",
        index: 0,
        subjectId: "subject_math",
        tagIds: ["tag_focus", "tag_focus"],
        status: "completed",
        plannedMinutes: 30,
        elapsedSeconds: 1800,
        startedAt: null,
        completedAt: now,
        note: "Covered derivatives.",
        createdAt: now,
        updatedAt: now,
      },
    ],
    dailyFractals: [],
    settings: {
      id: "app",
      blockMinutes: 30,
      theme: "system",
      locale: "en",
      onboardingCompletedAt: now,
      onboardingVersion: 1,
      startOfWeek: "monday",
      screensaverEnabled: true,
      screensaverDelaySeconds: 180,
      notificationsEnabled: false,
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe("normalizeExportPayload", () => {
  it("normalizes a valid export payload", () => {
    const normalized = normalizeExportPayload(validPayload());

    expect(normalized.tags[0].color).toBe("var(--color-primary)");
    expect(normalized.subjects[0].color).toBe("var(--color-primary)");
    expect(normalized.studyBlocks[0].tagIds).toEqual(["tag_focus"]);
    expect(normalized.dailyFractals).toEqual([]);
    expect(normalized.settings?.locale).toBe("en");
  });

  it("preserves bounded daily artwork geometry", () => {
    const payload = validPayload();
    payload.dailyFractals = [
      {
        id: "fractal_2026-05-22",
        date: "2026-05-22",
        seed: "coin-partition-art:streak-1",
        params: {
          date: "2026-05-22",
          dailyPomodoroCount: 1,
          consecutivePomodoroStreak: 1,
          overallStudyStreakDays: 1,
          longestStudyStreakDays: 1,
          subjectStreaks: { subject_math: 1 },
          tagStreaks: { tag_focus: 1 },
          totalMinutesToday: 30,
          completedBlocksToday: 1,
          daysSinceLastUse: 0,
          dominantSubjectId: "subject_math",
          dominantSubjectColor: "#2563eb",
          dominantTagIds: ["tag_focus"],
          dominantTagColors: ["#2563eb"],
          seed: "coin-partition-art:streak-1",
        },
        config: {
          seed: "coin-partition-art:streak-1",
          background: [],
          palette: ["#2563eb"],
          depth: 3,
          symmetry: 5,
          rotation: 0,
          curl: 0.1,
          spread: 0.4,
          branchScale: 0.7,
          lineWidth: 1,
          glow: 0.2,
          rings: 2,
          branches: [],
          artwork: {
            pageWidth: 210,
            pageHeight: 297,
            lineCount: 5,
            hatchSpacing: 3,
            faces: [
              {
                id: 1,
                polygon: [
                  { x: 0, y: 0 },
                  { x: 210, y: 0 },
                  { x: 210, y: 297 },
                ],
                hatchSegments: [{ a: { x: 0, y: 0 }, b: { x: 210, y: 297 } }],
                inverted: false,
                color: "#ffffff",
              },
            ],
          },
        },
        createdAt: now,
        updatedAt: now,
      },
    ];

    const normalized = normalizeExportPayload(payload);

    expect(normalized.dailyFractals[0]?.config.artwork?.lineCount).toBe(5);
    expect(normalized.dailyFractals[0]?.config.artwork?.faces[0]?.hatchSegments).toHaveLength(1);
  });

  it("rejects malformed payloads before import", () => {
    expect(() => normalizeExportPayload({ version: 1, subjects: [], tags: [], studyDays: [], studyBlocks: "nope" })).toThrow(
      /Invalid import payload/,
    );
    expect(() => normalizeExportPayload({ ...validPayload(), subjects: [validPayload().subjects[0], validPayload().subjects[0]] })).toThrow(
      /Invalid import payload/,
    );
    expect(() => normalizeExportPayload({ ...validPayload(), studyBlocks: [{ ...validPayload().studyBlocks[0], status: "done" }] })).toThrow(
      /Invalid import payload/,
    );
  });
});
