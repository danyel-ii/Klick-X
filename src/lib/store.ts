"use client";

import { create } from "zustand";
import { buildStatsSummary } from "./analytics";
import * as data from "./db";
import { localDateKey } from "./date";
import { dictionaries, type Dictionary } from "./i18n";
import type {
  AppSettings,
  AppSnapshot,
  CalendarDaySummary,
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
  return status === 503 && message.includes("DATABASE_URL is not configured");
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
  const [subjects, tags, today, calendarSummary, allDays, allBlocks] = await Promise.all([
    data.listSubjects(),
    data.listTags(),
    data.getTodayDay(),
    data.getCalendarSummary(),
    data.db.studyDays.toArray(),
    data.db.studyBlocks.toArray(),
  ]);
  const todayBlocks = today ? await data.listBlocksForDate(today.date) : [];
  return { settings, subjects, tags, today: today ?? null, todayBlocks, calendarSummary, allDays, allBlocks };
}

async function loadRemoteSnapshot() {
  const response = await fetch("/api/study", { cache: "no-store" });
  if (!response.ok) await throwRemoteError(response, "Remote database is unavailable.");
  return (await response.json()) as AppSnapshot;
}

async function remoteMutation(action: string, payload?: unknown) {
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  if (!response.ok) await throwRemoteError(response, "Remote database mutation failed.");
  return (await response.json()) as AppSnapshot;
}

async function remoteStats(filters: StatsFilters) {
  const response = await fetch("/api/study", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
  if (!response.ok) await throwRemoteError(response, "Remote database stats failed.");
  return (await response.json()) as StatsSummary;
}

function stateFromSnapshot(snapshot: AppSnapshot) {
  return {
    ...snapshot,
    t: dictionaries[snapshot.settings.locale],
    hydrated: true,
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
      await get().refresh();
    }
  },
  updateSettings: async (patch) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateSettings", { patch })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateSettings(patch);
      await get().refresh();
    }
  },
  completeOnboarding: async () => {
    try {
      set(stateFromSnapshot(await remoteMutation("completeOnboarding")));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.completeOnboarding();
      await get().refresh();
    }
  },
  resetOnboarding: async () => {
    try {
      set(stateFromSnapshot(await remoteMutation("resetOnboarding")));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.resetOnboarding();
      await get().refresh();
    }
  },
  createSubject: async (input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createSubject", { input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createSubject(input);
      await get().refresh();
    }
  },
  updateSubject: async (id, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateSubject", { id, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateSubject(id, input);
      await get().refresh();
    }
  },
  archiveSubject: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("archiveSubject", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.archiveSubject(id);
      await get().refresh();
    }
  },
  restoreSubject: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("restoreSubject", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.restoreSubject(id);
      await get().refresh();
    }
  },
  deleteSubject: async (id, force = false) => {
    try {
      set(stateFromSnapshot(await remoteMutation("deleteSubject", { id, force })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteSubject(id, force);
      await get().refresh();
    }
  },
  createTag: async (input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createTag", { input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createTag(input);
      await get().refresh();
    }
  },
  updateTag: async (id, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateTag", { id, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateTag(id, input);
      await get().refresh();
    }
  },
  archiveTag: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("archiveTag", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.archiveTag(id);
      await get().refresh();
    }
  },
  restoreTag: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("restoreTag", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.restoreTag(id);
      await get().refresh();
    }
  },
  deleteTag: async (id, force = false) => {
    try {
      set(stateFromSnapshot(await remoteMutation("deleteTag", { id, force })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteTag(id, force);
      await get().refresh();
    }
  },
  createOrUpdateDayPlan: async (date, plannedBlockCount, assignments) => {
    try {
      set(stateFromSnapshot(await remoteMutation("createOrUpdateDayPlan", { date, plannedBlockCount, assignments })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.createOrUpdateDayPlan(date, plannedBlockCount, assignments);
      await get().refresh();
    }
  },
  addBlockToDay: async (date, input) => {
    try {
      set(stateFromSnapshot(await remoteMutation("addBlockToDay", { date, input })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.addBlockToDay(date, input);
      await get().refresh();
    }
  },
  deleteBlock: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("deleteBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.deleteBlock(id);
      await get().refresh();
    }
  },
  startBlock: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("startBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.startBlock(id);
      await get().refresh();
    }
  },
  pauseBlock: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("pauseBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.pauseBlock(id);
      await get().refresh();
    }
  },
  completeBlock: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("completeBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.completeBlock(id);
      await get().refresh();
    }
  },
  skipBlock: async (id) => {
    try {
      set(stateFromSnapshot(await remoteMutation("skipBlock", { id })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.skipBlock(id);
      await get().refresh();
    }
  },
  updateBlockSubject: async (id, subjectId) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateBlockSubject", { id, subjectId })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateBlockSubject(id, subjectId);
      await get().refresh();
    }
  },
  updateBlockTags: async (id, tagIds) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateBlockTags", { id, tagIds })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateBlockTags(id, tagIds);
      await get().refresh();
    }
  },
  updateBlockNote: async (id, note) => {
    try {
      set(stateFromSnapshot(await remoteMutation("updateBlockNote", { id, note })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.updateBlockNote(id, note);
      await get().refresh();
    }
  },
  loadStats: async (filters) => {
    try {
      set({ stats: await remoteStats(filters) });
    } catch (error) {
      assertLocalFallbackAllowed(error);
      const state = get();
      if (state.hydrated) {
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
        return;
      }
      set({ stats: await data.getStats(filters) });
    }
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
        settings: state.settings,
      };
    }
    return data.exportLocalData();
  },
  importLocalData: async (payload) => {
    try {
      set(stateFromSnapshot(await remoteMutation("importLocalData", { payload })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.importLocalData(payload);
      await get().refresh();
    }
  },
  resetLocalData: async () => {
    try {
      set(stateFromSnapshot(await remoteMutation("resetLocalData", { confirm: "RESET" })));
    } catch (error) {
      assertLocalFallbackAllowed(error);
      await data.resetLocalData();
      await get().initialize();
    }
  },
}));
