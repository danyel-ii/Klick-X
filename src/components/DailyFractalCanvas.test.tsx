// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DailyFractal } from "@/lib/types";
import { DailyFractalCanvas } from "./DailyFractalCanvas";

const now = "2026-07-11T12:00:00.000Z";
const fractal = {
  id: "fractal_test",
  date: "2026-07-11",
  status: "active",
  totalSteps: 2,
  visibleSteps: 1,
  seed: "test-seed",
  params: {
    date: "2026-07-11",
    dailyPomodoroCount: 1,
    consecutivePomodoroStreak: 1,
    overallStudyStreakDays: 1,
    longestStudyStreakDays: 1,
    subjectStreaks: {},
    tagStreaks: {},
    totalMinutesToday: 30,
    completedBlocksToday: 1,
    daysSinceLastUse: 0,
    dominantSubjectColor: "#000000",
    dominantTagIds: [],
    dominantTagColors: [],
    seed: "test-seed",
  },
  config: {
    seed: "test-seed",
    background: [],
    palette: ["#000000"],
    depth: 1,
    symmetry: 1,
    rotation: 0,
    curl: 0,
    spread: 0,
    branchScale: 0,
    lineWidth: 1,
    glow: 0,
    rings: 0,
    branches: [],
    artwork: {
      pageWidth: 20,
      pageHeight: 30,
      lineCount: 2,
      hatchSpacing: 3,
      faces: [
        {
          id: 1,
          polygon: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 10 }],
          hatchSegments: [
            { a: { x: 1, y: 2 }, b: { x: 3, y: 4 } },
            { a: { x: 5, y: 6 }, b: { x: 7, y: 8 } },
          ],
          inverted: false,
          color: "#ffffff",
        },
        {
          id: 2,
          polygon: [{ x: 10, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 10 }],
          hatchSegments: [],
          inverted: true,
          color: "#000000",
        },
      ],
    },
  },
  createdAt: now,
  updatedAt: now,
} satisfies DailyFractal;

describe("DailyFractalCanvas", () => {
  afterEach(cleanup);

  it("combines a face's hatch segments into one accessible SVG path", () => {
    render(<DailyFractalCanvas fractal={fractal} label="Study artwork" />);

    const artwork = screen.getByRole("img", { name: "Study artwork" });
    const hatchPaths = artwork.querySelectorAll('[data-hatches="true"]');

    expect(artwork.querySelectorAll("polyline")).toHaveLength(0);
    expect(hatchPaths).toHaveLength(1);
    expect(hatchPaths[0]?.getAttribute("d")).toBe("M 1 2 L 3 4 M 5 6 L 7 8");
    expect(artwork.querySelectorAll("#pending-faces > path")).toHaveLength(0);
  });

  it("preserves the fully revealed appearance of completed legacy artwork", () => {
    const thirdFace = { ...fractal.config.artwork!.faces[1]!, id: 3 };
    const legacy = {
      ...fractal,
      status: "completed" as const,
      visibleSteps: 2,
      config: { ...fractal.config, artwork: { ...fractal.config.artwork!, faces: [...fractal.config.artwork!.faces, thirdFace] } },
    };

    render(<DailyFractalCanvas fractal={legacy} label="Completed legacy artwork" />);

    expect(screen.getByRole("img", { name: "Completed legacy artwork" }).querySelectorAll("#final-faces > g")).toHaveLength(3);
  });
});
