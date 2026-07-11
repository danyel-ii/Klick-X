import { afterEach, describe, expect, it, vi } from "vitest";
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
  id: "block_mutation",
  dayId: "day_mutation",
  date: "2026-07-11",
  index: 0,
  subjectId: "subject_initial",
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

function deltaResponse(subjectId: string, updatedAt: string) {
  return new Response(JSON.stringify({ blocks: [{ ...block, subjectId, updatedAt }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("block mutation ordering", () => {
  afterEach(() => {
    useAppStore.setState({ todayBlocks: [], allBlocks: [] });
    vi.unstubAllGlobals();
  });

  it("serializes rapid block changes so the latest user intent wins", async () => {
    const firstResponse = deferred<Response>();
    const secondResponse = deferred<Response>();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() => firstResponse.promise)
      .mockImplementationOnce(() => secondResponse.promise);
    vi.stubGlobal("fetch", fetchMock);
    useAppStore.setState({ todayBlocks: [block], allBlocks: [block] });

    const firstChange = useAppStore.getState().updateBlockSubject(block.id, "subject_first");
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const secondChange = useAppStore.getState().updateBlockSubject(block.id, "subject_second");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    firstResponse.resolve(deltaResponse("subject_first", "2026-07-11T08:01:00.000Z"));
    await firstChange;
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    secondResponse.resolve(deltaResponse("subject_second", "2026-07-11T08:02:00.000Z"));
    await secondChange;

    expect(useAppStore.getState().todayBlocks[0]?.subjectId).toBe("subject_second");
    expect(useAppStore.getState().allBlocks[0]?.subjectId).toBe("subject_second");
  });
});
