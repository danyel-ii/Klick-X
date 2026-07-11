"use client";

import { create } from "zustand";
import { buildCalendarSummary, buildStatsSummary } from "./analytics";
import * as data from "./db";
import { localDateKey } from "./date";
import { compactDailyFractal } from "./fractals";
import { dictionaries, type Dictionary } from "./i18n";
import type {
  AppSettings,
  AppSnapshot,
  CalendarDaySummary,
  DailyFractal,
  DayAssignment,
  ExportPayload,
  Locale,
  StatsFilters,
  StatsSummary,
  StudyBlock,
  StudyDay,
  Subject,
  Tag,
} from "./types";

type AppState = {
  hydrated: boolean;
  settings: AppSettings | null;
  subjects: Subject[];
  tags: Tag[];
  today: StudyDay | null;
  todayBlocks: StudyBlock[];
  allDays: StudyDay[];
  allBlocks: StudyBlock[];
  dailyFractals: DailyFractal[];
  calendarSummary: CalendarDaySummary[];
  stats: StatsSummary | null;
  t: Dictionary;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  createSubject: (input: { name: string; color: string; icon?: string }) => Promise<void>;
  updateSubject: (id: string, input: Partial<Pick<Subject, "name" | "color" | "icon">>) => Promise<void>;
  archiveSubject: (id: string) => Promise<void>;
  restoreSubject: (id: string) => Promise<void>;
  deleteSubject: (id: string, force?: boolean) => Promise<void>;
  createTag: (input: { name: string; color: string; description?: string }) => Promise<void>;
  updateTag: (id: string, input: Partial<Pick<Tag, "name" | "color" | "description">>) => Promise<void>;
  archiveTag: (id: string) => Promise<void>;
  restoreTag: (id: string) => Promise<void>;
  deleteTag: (id: string, force?: boolean) => Promise<void>;
  createOrUpdateDayPlan: (date: string, plannedBlockCount: number, assignments: DayAssignment[]) => Promise<void>;
  addBlockToDay: (date: string, input: DayAssignment) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  startBlock: (id: string) => Promise<void>;
  pauseBlock: (id: string) => Promise<void>;
  completeBlock: (id: string) => Promise<void>;
  skipBlock: (id: string) => Promise<void>;
  updateBlockSubject: (id: string, subjectId: string) => Promise<void>;
  updateBlockTags: (id: string, tagIds: string[]) => Promise<void>;
  updateBlockNote: (id: string, note: string) => Promise<void>;
  loadStats: (filters: StatsFilters) => Promise<void>;
  exportLocalData: () => Promise<ExportPayload>;
  importLocalData: (payload: ExportPayload) => Promise<void>;
  resetLocalData: () => Promise<void>;
};

class RemoteRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fallbackAllowed: boolean,
  ) {
    super(message);
    this.name = "RemoteRequestError";
  }
}

function fallbackAllowedFor(status: number, message: string) {
  return status === 401 || status === 403 || status >= 500 || message.includes("DATABASE_URL is not configured");
}

async function throwRemoteError(response: Response, fallbackMessage: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  const message = body?.error ?? fallbackMessage;
  throw new RemoteRequestError(message, response.status, fallbackAllowedFor(response.status, message));
}

function shouldUseLocalFallback(error: unknown) {
  return error instanceof TypeError || (error instanceof RemoteRequestError && error.fallbackAllowed);
}

function assertLocalFallbackAllowed(error: unknown) {
  if (!shouldUseLocalFallback(error)) throw error;
}

async function loadSnapshot() {
  const settings = await data.getSettings();
  await data.seedDefaultSubjectsIfEmpty(settings.locale);
  await data.seedDefaultTagsIfEmpty(settings.locale);
  await data.ensureDailyFractalProgress(localDateKey());
  const [subjects, tags, allDays, allBlocks, persistedDailyFractals] = await Promise.all([
    data.listSubjects(),
    data.listTags(),
    data.db.studyDays.toArray(),
    data.db.studyBlocks.toArray(),
    data.db.dailyFractals.toArray(),
  ]);
  const today = allDays.find((day) => day.date === localDateKey()) ?? null;
  const todayBlocks = today ? allBlocks.filter((block) => block.date === today.date).sort((left, right) => left.index - right.index) : [];
  return {
    settings,
    subjects,
    tags,
    today,
    todayBlocks,
    calendarSummary: buildCalendarSummary(allDays, allBlocks),
    allDays,
    allBlocks,
    dailyFractals: persistedDailyFractals.map(compactDailyFractal),
  };
}

async function loadRemoteSnapshot() {
  const response = await fetch("/api/study", { cache: "no-store", headers: { "X-Study-Date": localDateKey() } });
  if (!response.ok) await throwRemoteError(response, "Remote database is unavailable.");
  const snapshot = await reconcilePendingBlockNotes((await response.json()) as AppSnapshot);
  await cacheRemoteSnapshot(snapshot);
  return snapshot;
}

async function remoteMutation(action: string, payload?: unknown) {
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Study-Date": localDateKey() },
    body: JSON.stringify({ action, payload }),
  });
  if (!response.ok) await throwRemoteError(response, "Remote database mutation failed.");
  const snapshot = await reconcilePendingBlockNotes((await response.json()) as AppSnapshot);
  await cacheRemoteSnapshot(snapshot);
  return snapshot;
}

async function sendRemoteBlockNoteMutation(id: string, note: string) {
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Study-Date": localDateKey() },
    body: JSON.stringify({ action: "updateBlockNote", payload: { id, note } }),
  });
  if (!response.ok) await throwRemoteError(response, "Block note could not be saved.");
  const result = (await response.json()) as { block?: StudyBlock | null };
  if (!result.block) throw new RemoteRequestError("Block not found.", 404, false);
  return result.block;
}

const pendingBlockNoteStorageKey = "study-blocks:pending-notes";
const pendingBlockNotes = new Map<string, string>();
let pendingBlockNotesLoaded = false;

function loadPendingBlockNotes() {
  if (pendingBlockNotesLoaded) return pendingBlockNotes;
  pendingBlockNotesLoaded = true;
  if (typeof localStorage === "undefined") return pendingBlockNotes;
  try {
    const stored = JSON.parse(localStorage.getItem(pendingBlockNoteStorageKey) ?? "[]") as unknown;
    if (Array.isArray(stored)) {
      for (const entry of stored) {
        if (Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "string") pendingBlockNotes.set(entry[0], entry[1]);
      }
    }
  } catch {
    // Ignore unavailable or malformed local recovery data.
  }
  return pendingBlockNotes;
}

function persistPendingBlockNotes() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(pendingBlockNoteStorageKey, JSON.stringify([...pendingBlockNotes]));
  } catch {
    // IndexedDB still retains the local note when storage is unavailable.
  }
}

function rememberPendingBlockNote(id: string, note: string) {
  loadPendingBlockNotes().set(id, note);
  persistPendingBlockNotes();
}

function forgetPendingBlockNote(id: string, expectedNote?: string) {
  const notes = loadPendingBlockNotes();
  if (expectedNote !== undefined && notes.get(id) !== expectedNote) return;
  notes.delete(id);
  persistPendingBlockNotes();
}

function clearPendingBlockNotes() {
  loadPendingBlockNotes().clear();
  persistPendingBlockNotes();
}

async function remoteBlockNoteMutation(id: string, note: string) {
  const block = await sendRemoteBlockNoteMutation(id, note);
  forgetPendingBlockNote(id, note);
  return block;
}

async function reconcilePendingBlockNotes(snapshot: AppSnapshot) {
  let next = snapshot;
  for (const [id, note] of loadPendingBlockNotes()) {
    await enqueueBlockNoteSave(id, async () => {
      const currentOverlay = blockNoteOverlays.get(id);
      if (currentOverlay && currentOverlay.note !== note) return;
      try {
        const saved = await sendRemoteBlockNoteMutation(id, note);
        const apply = (block: StudyBlock) =>
          block.id === id ? { ...block, note: saved.note ?? note, updatedAt: block.updatedAt > saved.updatedAt ? block.updatedAt : saved.updatedAt } : block;
        next = { ...next, todayBlocks: next.todayBlocks.map(apply), allBlocks: next.allBlocks.map(apply) };
        const overlay = blockNoteOverlays.get(id);
        if (overlay?.note === note) blockNoteOverlays.set(id, { ...overlay, confirmedAt: Date.now() });
        forgetPendingBlockNote(id, note);
      } catch (error) {
        if (error instanceof RemoteRequestError && error.status === 404) {
          forgetPendingBlockNote(id, note);
        } else {
          const applyPending = (block: StudyBlock) => (block.id === id ? { ...block, note } : block);
          next = { ...next, todayBlocks: next.todayBlocks.map(applyPending), allBlocks: next.allBlocks.map(applyPending) };
        }
      }
    });
  }
  return next;
}

type BlockMutationDelta = { blocks: StudyBlock[]; dailyFractals?: DailyFractal[] };

async function remoteBlockMutation(action: string, payload: unknown) {
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Study-Date": localDateKey() },
    body: JSON.stringify({ action, payload }),
  });
  if (!response.ok) await throwRemoteError(response, "Block could not be updated.");
  return (await response.json()) as BlockMutationDelta;
}

let blockMutationQueue: Promise<unknown> = Promise.resolve();
const blockFieldRevisions = new Map<string, number>();
let blockFieldRevision = 0;

function enqueueRemoteBlockMutation(action: string, payload: unknown) {
  const queued = blockMutationQueue.catch(() => undefined).then(() => remoteBlockMutation(action, payload));
  blockMutationQueue = queued;
  return queued;
}

function beginBlockFieldMutation(blockId: string, kind: "subject" | "tags") {
  const key = `${kind}:${blockId}`;
  const revision = ++blockFieldRevision;
  blockFieldRevisions.set(key, revision);
  return { key, revision };
}

function isCurrentBlockFieldMutation(intent: { key: string; revision: number }) {
  return blockFieldRevisions.get(intent.key) === intent.revision;
}

async function cacheRemoteSnapshot(snapshot: AppSnapshot) {
  await data.importLocalData({
    version: 1,
    exportedAt: new Date().toISOString(),
    subjects: snapshot.subjects,
    tags: snapshot.tags,
    studyDays: snapshot.allDays,
    studyBlocks: snapshot.allBlocks,
    dailyFractals: snapshot.dailyFractals,
    settings: snapshot.settings,
  }).catch(() => undefined);
}

async function cacheRemoteBlockDelta(state: AppState, delta: BlockMutationDelta) {
  const changedIds = new Set((delta.blocks ?? []).map((block) => block.id));
  const blocks = state.allBlocks.filter((block) => changedIds.has(block.id));
  await data.cacheRemoteDelta(blocks, delta.dailyFractals ?? []).catch(() => undefined);
}

const blockNoteSaveQueues = new Map<string, Promise<void>>();
const blockNoteOverlayRetentionMs = 120_000;
const blockNoteOverlays = new Map<string, { note: string; updatedAt: string; revision: number; confirmedAt?: number }>();
let blockNoteRevision = 0;

function pruneConfirmedBlockNoteOverlays() {
  const retentionCutoff = Date.now() - blockNoteOverlayRetentionMs;
  for (const [blockId, overlay] of blockNoteOverlays) {
    if (overlay.confirmedAt !== undefined && overlay.confirmedAt < retentionCutoff) blockNoteOverlays.delete(blockId);
  }
}

function stateFromSnapshot(snapshot: AppSnapshot) {
  pruneConfirmedBlockNoteOverlays();
  return {
    ...snapshot,
    todayBlocks: snapshot.todayBlocks.map(applyBlockNoteOverlay),
    allBlocks: snapshot.allBlocks.map(applyBlockNoteOverlay),
    dailyFractals: snapshot.dailyFractals ?? [],
    t: dictionaries[snapshot.settings.locale],
    hydrated: true,
  };
}

function enqueueBlockNoteSave(blockId: string, save: () => Promise<void>) {
  const previous = blockNoteSaveQueues.get(blockId) ?? Promise.resolve();
  const queued = previous.catch(() => undefined).then(save);
  blockNoteSaveQueues.set(blockId, queued);
  return queued.finally(() => {
    if (blockNoteSaveQueues.get(blockId) === queued) blockNoteSaveQueues.delete(blockId);
  });
}

function withBlockNote(block: StudyBlock, id: string, note: string, updatedAt: string) {
  if (block.id !== id) return block;
  return { ...block, note, updatedAt: block.updatedAt > updatedAt ? block.updatedAt : updatedAt };
}

function applyBlockNoteOverlay(block: StudyBlock) {
  const overlay = blockNoteOverlays.get(block.id);
  if (overlay?.confirmedAt !== undefined && (block.note ?? "") === overlay.note) {
    blockNoteOverlays.delete(block.id);
    return block;
  }
  return overlay ? withBlockNote(block, block.id, overlay.note, overlay.updatedAt) : block;
}

function mergeEntitiesById<T extends { id: string }>(current: T[], changed: T[]) {
  if (!changed.length) return current;
  const changedById = new Map(changed.map((item) => [item.id, item]));
  const merged = current.map((item) => changedById.get(item.id) ?? item);
  const currentIds = new Set(current.map((item) => item.id));
  for (const item of changed) {
    if (!currentIds.has(item.id)) merged.push(item);
  }
  return merged;
}

type BlockMutationKind = "runtime" | "subject" | "tags";

function mergeBlockMutation(current: StudyBlock[], changed: StudyBlock[], kind: BlockMutationKind) {
  if (!changed.length) return current;
  const changedById = new Map(changed.map((block) => [block.id, block]));
  const merged = current.map((block) => {
    const incoming = changedById.get(block.id);
    if (!incoming) return block;
    const updatedAt = block.updatedAt > incoming.updatedAt ? block.updatedAt : incoming.updatedAt;
    const next = kind === "runtime"
      ? { ...block, status: incoming.status, elapsedSeconds: incoming.elapsedSeconds, startedAt: incoming.startedAt, completedAt: incoming.completedAt, updatedAt }
      : kind === "subject"
        ? { ...block, subjectId: incoming.subjectId, updatedAt }
        : { ...block, tagIds: incoming.tagIds, updatedAt };
    return applyBlockNoteOverlay(next);
  });
  const currentIds = new Set(current.map((block) => block.id));
  for (const block of changed) {
    if (!currentIds.has(block.id)) merged.push(applyBlockNoteOverlay(block));
  }
  return merged;
}

function blockMutationStatePatch(state: AppState, delta: BlockMutationDelta, kind: BlockMutationKind) {
  pruneConfirmedBlockNoteOverlays();
  const changedBlocks = delta.blocks ?? [];
  const allBlocks = mergeBlockMutation(state.allBlocks, changedBlocks, kind);
  const todayBlockIds = new Set(state.todayBlocks.map((block) => block.id));
  const todayBlocks = mergeBlockMutation(
    state.todayBlocks,
    changedBlocks.filter((block) => todayBlockIds.has(block.id) || block.date === state.today?.date),
    kind,
  ).sort((a, b) => a.index - b.index);
  const dailyFractals = mergeEntitiesById(state.dailyFractals, (delta.dailyFractals ?? []).map(compactDailyFractal));
  return {
    allBlocks,
    todayBlocks,
    dailyFractals,
    calendarSummary: buildCalendarSummary(state.allDays, allBlocks),
  };
}

function blockNoteStatePatch(state: Pick<AppState, "todayBlocks" | "allBlocks">, id: string, note: string, updatedAt: string) {
  return {
    todayBlocks: state.todayBlocks.map((block) => withBlockNote(block, id, note, updatedAt)),
    allBlocks: state.allBlocks.map((block) => withBlockNote(block, id, note, updatedAt)),
  };
}

function optimisticBlockFieldPatch(state: Pick<AppState, "todayBlocks" | "allBlocks">, id: string, patch: Pick<StudyBlock, "subjectId"> | Pick<StudyBlock, "tagIds">) {
  const updatedAt = new Date().toISOString();
  const apply = (block: StudyBlock) => (block.id === id ? { ...block, ...patch, updatedAt } : block);
  return {
    todayBlocks: state.todayBlocks.map(apply),
    allBlocks: state.allBlocks.map(apply),
  };
}

function blockNoteAcknowledgementPatch(state: Pick<AppState, "todayBlocks" | "allBlocks">, saved: StudyBlock, submittedNote: string) {
  if ((saved.note ?? "") !== submittedNote) return { todayBlocks: state.todayBlocks, allBlocks: state.allBlocks };
  const acknowledge = (block: StudyBlock) => {
    if (block.id !== saved.id || (block.note ?? "") !== submittedNote) return block;
    return withBlockNote(block, saved.id, saved.note ?? "", saved.updatedAt);
  };
  return {
    todayBlocks: state.todayBlocks.map(acknowledge),
    allBlocks: state.allBlocks.map(acknowledge),
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  settings: null,
  subjects: [],
  tags: [],
  today: null,
  todayBlocks: [],
  allDays: [],
  allBlocks: [],
  dailyFractals: [],
  calendarSummary: [],
  stats: null,
  t: dictionaries.en,
  initialize: async () => {
    try {
      set(stateFromSnapshot(await loadRemoteSnapshot()));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  refresh: async () => {
    try {
      set(stateFromSnapshot(await loadRemoteSnapshot()));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  setLocale: async (locale) => {
    try {
      set(stateFromSnapshot(await remoteMutation("setLocale", { locale })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.setLocale(locale);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateSettings: async (patch) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateSettings", { patch })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateSettings(patch);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  completeOnboarding: async () => {
    try {
      set(stateFromSnapshot(await remoteMutation("completeOnboarding")));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.completeOnboarding();
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  resetOnboarding: async () => {
    try {
      set(stateFromSnapshot(await remoteMutation("resetOnboarding")));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.resetOnboarding();
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  createSubject: async (input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createSubject", { input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createSubject(input);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateSubject: async (id, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateSubject", { id, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateSubject(id, input);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  archiveSubject: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("archiveSubject", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.archiveSubject(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  restoreSubject: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("restoreSubject", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.restoreSubject(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  deleteSubject: async (id, force = false) => {
    try {
      set(stateFromSnapshot(await remoteMutation("deleteSubject", { id, force })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteSubject(id, force);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  createTag: async (input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createTag", { input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createTag(input);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateTag: async (id, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateTag", { id, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateTag(id, input);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  archiveTag: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("archiveTag", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.archiveTag(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  restoreTag: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("restoreTag", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.restoreTag(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  deleteTag: async (id, force = false) => {
    try {
      set(stateFromSnapshot(await remoteMutation("deleteTag", { id, force })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteTag(id, force);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  createOrUpdateDayPlan: async (date, plannedBlockCount, assignments) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createOrUpdateDayPlan", { date, plannedBlockCount, assignments })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createOrUpdateDayPlan(date, plannedBlockCount, assignments);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  addBlockToDay: async (date, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("addBlockToDay", { date, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.addBlockToDay(date, input);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  deleteBlock: async (id) => {
    blockNoteOverlays.delete(id);
    forgetPendingBlockNote(id);
    try {
      set(stateFromSnapshot(await remoteMutation("deleteBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteBlock(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  startBlock: async (id) => {
    try {
      const delta = await enqueueRemoteBlockMutation("startBlock", { id });
      set((state) => blockMutationStatePatch(state, delta, "runtime"));
      await cacheRemoteBlockDelta(get(), delta);
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.startBlock(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  pauseBlock: async (id) => {
    try {
      const delta = await enqueueRemoteBlockMutation("pauseBlock", { id });
      set((state) => blockMutationStatePatch(state, delta, "runtime"));
      await cacheRemoteBlockDelta(get(), delta);
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.pauseBlock(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  completeBlock: async (id) => {
    try {
      const delta = await enqueueRemoteBlockMutation("completeBlock", { id });
      set((state) => blockMutationStatePatch(state, delta, "runtime"));
      await cacheRemoteBlockDelta(get(), delta);
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.completeBlock(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  skipBlock: async (id) => {
    try {
      const delta = await enqueueRemoteBlockMutation("skipBlock", { id });
      set((state) => blockMutationStatePatch(state, delta, "runtime"));
      await cacheRemoteBlockDelta(get(), delta);
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.skipBlock(id);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateBlockSubject: async (id, subjectId) => {
    const intent = beginBlockFieldMutation(id, "subject");
    set((state) => optimisticBlockFieldPatch(state, id, { subjectId }));
    try {
      const delta = await enqueueRemoteBlockMutation("updateBlockSubject", { id, subjectId });
      if (!isCurrentBlockFieldMutation(intent)) return;
      set((state) => blockMutationStatePatch(state, delta, "subject"));
      await cacheRemoteBlockDelta(get(), delta);
      blockFieldRevisions.delete(intent.key);
    } catch (error) {
      if (!isCurrentBlockFieldMutation(intent)) return;
      blockFieldRevisions.delete(intent.key);
      if (!shouldUseLocalFallback(error)) {
        await get().refresh().catch(() => undefined);
        throw error;
      }
      await data.updateBlockSubject(id, subjectId);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateBlockTags: async (id, tagIds) => {
    const intent = beginBlockFieldMutation(id, "tags");
    set((state) => optimisticBlockFieldPatch(state, id, { tagIds }));
    try {
      const delta = await enqueueRemoteBlockMutation("updateBlockTags", { id, tagIds });
      if (!isCurrentBlockFieldMutation(intent)) return;
      set((state) => blockMutationStatePatch(state, delta, "tags"));
      await cacheRemoteBlockDelta(get(), delta);
      blockFieldRevisions.delete(intent.key);
    } catch (error) {
      if (!isCurrentBlockFieldMutation(intent)) return;
      blockFieldRevisions.delete(intent.key);
      if (!shouldUseLocalFallback(error)) {
        await get().refresh().catch(() => undefined);
        throw error;
      }
      await data.updateBlockTags(id, tagIds);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  updateBlockNote: async (id, note) => {
    const updatedAt = new Date().toISOString();
    const intent = { note, updatedAt, revision: ++blockNoteRevision };
    rememberPendingBlockNote(id, note);
    blockNoteOverlays.set(id, intent);
    set((state) => blockNoteStatePatch(state, id, note, updatedAt));
    await enqueueBlockNoteSave(id, async () => {
      const currentIntent = blockNoteOverlays.get(id);
      if (!currentIntent || currentIntent.revision !== intent.revision) return;
      try {
        const saved = await remoteBlockNoteMutation(id, note);
        const latestIntent = blockNoteOverlays.get(id);
        if (!latestIntent || latestIntent.revision !== intent.revision) return;
        blockNoteOverlays.set(id, {
          ...latestIntent,
          updatedAt: latestIntent.updatedAt > saved.updatedAt ? latestIntent.updatedAt : saved.updatedAt,
          confirmedAt: Date.now(),
        });
        set((state) => blockNoteAcknowledgementPatch(state, saved, note));
        const current = get().allBlocks.find((block) => block.id === id);
        if (current) await data.cacheRemoteDelta([current]).catch(() => undefined);
      } catch (error) {
        const latestIntent = blockNoteOverlays.get(id);
        if (!latestIntent || latestIntent.revision !== intent.revision) return;
        if (shouldUseLocalFallback(error)) {
          await data.updateBlockNote(id, note);
          return;
        }
        forgetPendingBlockNote(id, note);
        blockNoteOverlays.delete(id);
        await get().refresh().catch(() => undefined);
      }
    });
  },
  loadStats: async (filters) => {
    const state = get();
    set({
      stats: buildStatsSummary({
        days: state.allDays,
        blocks: state.allBlocks,
        subjects: state.subjects,
        tags: state.tags,
        filters,
        todayKey: localDateKey(),
      }),
    });
  },
  exportLocalData: async () => {
    const state = get();
    if (state.hydrated && state.settings) {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        subjects: state.subjects,
        tags: state.tags,
        studyDays: state.allDays,
        studyBlocks: state.allBlocks,
        dailyFractals: state.dailyFractals,
        settings: state.settings,
      };
    }
    return data.exportLocalData();
  },
  importLocalData: async (payload) => {
    blockNoteOverlays.clear();
    clearPendingBlockNotes();
    try {
      set(stateFromSnapshot(await remoteMutation("importLocalData", { payload })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.importLocalData(payload);
      set(stateFromSnapshot(await loadSnapshot()));
    }
  },
  resetLocalData: async () => {
    blockNoteOverlays.clear();
    clearPendingBlockNotes();
    try {
      set(stateFromSnapshot(await remoteMutation("resetLocalData", { confirm: "RESET" })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.resetLocalData();
      await get().initialize();
    }
  },
}));
