import { afterEach, describe, expect, it, vi } from "vitest";
import * as data from "./db";
import { useAppStore } from "./store";
import type { StudyBlock } from "./types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const block: StudyBlock = {
  id: "block_note",
  dayId: "day_note",
  date: "2026-07-11",
  index: 0,
  subjectId: "subject_math",
  tagIds: [],
  status: "planned",
  plannedMinutes: 30,
  elapsedSeconds: 0,
  startedAt: null,
  completedAt: null,
  note: "",
  createdAt: "2026-07-11T08:00:00.000Z",
  updatedAt: "2026-07-11T08:00:00.000Z",
};

function responseFor(note: string, updatedAt: string) {
  return new Response(JSON.stringify({ block: { ...block, note, updatedAt } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function blockDeltaResponse(note: string, status: StudyBlock["status"], source = block) {
  const changedBlock = { ...source, note, status, updatedAt: "2026-07-11T08:01:30.000Z" };
  return new Response(JSON.stringify({ blocks: [changedBlock] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function snapshotResponse(note: string) {
  const studyDay = {
    id: block.dayId,
    date: block.date,
    plannedBlockCount: 1,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt,
  };
  return new Response(
    JSON.stringify({
      settings: {
        id: "app",
        blockMinutes: 30,
        theme: "system",
        locale: "en",
        onboardingCompletedAt: block.createdAt,
        onboardingVersion: 1,
        startOfWeek: "monday",
        screensaverEnabled: true,
        screensaverDelaySeconds: 180,
        notificationsEnabled: false,
        timerBeepEnabled: true,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      },
      subjects: [],
      tags: [],
      today: studyDay,
      todayBlocks: [{ ...block, note }],
      calendarSummary: [],
      allDays: [studyDay],
      allBlocks: [{ ...block, note }],
      dailyFractals: [],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

describe("block note saves", () => {
  afterEach(() => {
    useAppStore.setState({ todayBlocks: [], allBlocks: [] });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the newest optimistic note and serializes server writes", async () => {
    const firstResponse = deferred<Response>();
    const secondResponse = deferred<Response>();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => firstResponse.promise)
      .mockImplementationOnce(() => secondResponse.promise);
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.setState({ todayBlocks: [block], allBlocks: [block] });

    const firstSave = useAppStore.getState().updateBlockNote(block.id, "a");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const secondSave = useAppStore.getState().updateBlockNote(block.id, "ab");
    expect(useAppStore.getState().todayBlocks[0]?.note).toBe("ab");

    useAppStore.setState((state) => ({
      todayBlocks: state.todayBlocks.map((item) => (item.id === block.id ? { ...item, status: "active" as const } : item)),
      allBlocks: state.allBlocks.map((item) => (item.id === block.id ? { ...item, status: "active" as const } : item)),
    }));
    firstResponse.resolve(responseFor("a", "2026-07-11T08:01:00.000Z"));
    await firstSave;

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(useAppStore.getState().todayBlocks[0]).toMatchObject({ note: "ab", status: "active" });

    secondResponse.resolve(responseFor("ab", "2026-07-11T08:02:00.000Z"));
    await secondSave;

    expect(useAppStore.getState().todayBlocks[0]).toMatchObject({ note: "ab", status: "active" });
    expect(useAppStore.getState().allBlocks[0]).toMatchObject({ note: "ab", status: "active" });
  });

  it("overlays a pending note onto a stale block-mutation response", async () => {
    const noteResponse = deferred<Response>();
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      const request = JSON.parse(String(init?.body)) as { action: string };
      if (request.action === "updateBlockNote") return noteResponse.promise;
      if (request.action === "pauseBlock") return Promise.resolve(blockDeltaResponse("", "paused"));
      throw new Error(`Unexpected action: ${request.action}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.setState({ todayBlocks: [block], allBlocks: [block] });

    const noteSave = useAppStore.getState().updateBlockNote(block.id, "typed quickly");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    useAppStore.setState((state) => ({
      todayBlocks: state.todayBlocks.map((item) => (item.id === block.id ? { ...item, subjectId: "subject_new", tagIds: ["tag_new"] } : item)),
      allBlocks: state.allBlocks.map((item) => (item.id === block.id ? { ...item, subjectId: "subject_new", tagIds: ["tag_new"] } : item)),
    }));
    await useAppStore.getState().pauseBlock(block.id);

    expect(useAppStore.getState().todayBlocks[0]).toMatchObject({ note: "typed quickly", status: "paused", subjectId: "subject_new", tagIds: ["tag_new"] });

    noteResponse.resolve(responseFor("typed quickly", "2026-07-11T08:02:00.000Z"));
    await noteSave;

    expect(useAppStore.getState().todayBlocks[0]).toMatchObject({ note: "typed quickly", status: "paused" });
  });

  it("keeps a confirmed overlay long enough to block a later stale response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(responseFor("saved", "2026-07-11T08:02:00.000Z"))
      .mockResolvedValueOnce(blockDeltaResponse("saved", "paused"))
      .mockResolvedValueOnce(blockDeltaResponse("newer elsewhere", "paused"));
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.setState({ todayBlocks: [block], allBlocks: [block] });

    await useAppStore.getState().updateBlockNote(block.id, "saved");
    await useAppStore.getState().pauseBlock(block.id);
    await useAppStore.getState().pauseBlock(block.id);

    expect(useAppStore.getState().todayBlocks[0]).toMatchObject({ note: "saved", status: "paused" });
  });

  it("serializes an offline-note replay before a newer typed note", async () => {
    vi.spyOn(data, "updateBlockNote").mockResolvedValue(undefined);
    const replayResponse = deferred<Response>();
    const newerResponse = deferred<Response>();
    const submittedNotes: string[] = [];
    let olderAttempts = 0;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((_input, init) => {
      if (!init?.body) return Promise.resolve(snapshotResponse(""));
      const request = JSON.parse(String(init.body)) as { action: string; payload?: { note?: string } };
      if (request.action !== "updateBlockNote") throw new Error(`Unexpected action: ${request.action}`);
      const note = request.payload?.note ?? "";
      submittedNotes.push(note);
      if (note === "offline") {
        olderAttempts += 1;
        if (olderAttempts === 1) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "Database unavailable." }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        return replayResponse.promise;
      }
      if (note === "newer") return newerResponse.promise;
      throw new Error(`Unexpected note: ${note}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.setState({ todayBlocks: [block], allBlocks: [block] });

    await useAppStore.getState().updateBlockNote(block.id, "offline");
    const refresh = useAppStore.getState().refresh();
    await vi.waitFor(() => expect(olderAttempts).toBe(2));
    const newerSave = useAppStore.getState().updateBlockNote(block.id, "newer");

    expect(submittedNotes).toEqual(["offline", "offline"]);
    replayResponse.resolve(responseFor("offline", "2026-07-11T08:02:00.000Z"));
    await vi.waitFor(() => expect(submittedNotes).toEqual(["offline", "offline", "newer"]));
    newerResponse.resolve(responseFor("newer", "2026-07-11T08:03:00.000Z"));
    await Promise.all([refresh, newerSave]);

    expect(useAppStore.getState().todayBlocks[0]?.note).toBe("newer");
  });

});
