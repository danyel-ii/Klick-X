// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActiveBlockPanel } from "./ActiveBlockPanel";
import type { StudyBlock, Subject, Tag } from "../lib/types";

const block: StudyBlock = {
  id: "block_1",
  dayId: "day_1",
  date: "2026-05-23",
  index: 0,
  subjectId: "subject_1",
  tagIds: ["tag_1"],
  status: "active",
  plannedMinutes: 30,
  elapsedSeconds: 120,
  startedAt: "2026-05-23T08:00:00.000Z",
  completedAt: null,
  note: "",
  createdAt: "2026-05-23T07:50:00.000Z",
  updatedAt: "2026-05-23T07:50:00.000Z",
};

const subject: Subject = {
  id: "subject_1",
  name: "History",
  color: "#2563eb",
  icon: "",
  archivedAt: null,
  createdAt: "2026-05-23T07:50:00.000Z",
  updatedAt: "2026-05-23T07:50:00.000Z",
};

const tag: Tag = {
  id: "tag_1",
  name: "Deep focus",
  color: "var(--color-primary)",
  description: "",
  archivedAt: null,
  createdAt: "2026-05-23T07:50:00.000Z",
  updatedAt: "2026-05-23T07:50:00.000Z",
};

describe("ActiveBlockPanel", () => {
  it("renders active timer details from stable props", () => {
    render(<ActiveBlockPanel block={block} now={new Date("2026-05-23T08:01:00.000Z")} subject={subject} tags={[tag]} />);

    expect(screen.getByText("History")).toBeTruthy();
    expect(screen.getByText("Deep focus")).toBeTruthy();
    expect(screen.getByText("3:00")).toBeTruthy();
  });
});
