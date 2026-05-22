"use client";

import { create } from "zustand";
import * as data from "./db";
import { dictionaries, type Dictionary } from "./i18n";
import type {
  AppSettings,
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
  createTag: (input: { name: string; color: string; description?: string }) => Promise<void>;
  updateTag: (id: string, input: Partial<Pick<Tag, "name" | "color" | "description">>) => Promise<void>;
  archiveTag: (id: string) => Promise<void>;
  createOrUpdateDayPlan: (date: string, plannedBlockCount: number, assignments: DayAssignment[]) => Promise<void>;
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
  return { settings, subjects, tags, today, todayBlocks, calendarSummary, allDays, allBlocks };
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
    const snapshot = await loadSnapshot();
    set({
      ...snapshot,
      t: dictionaries[snapshot.settings.locale],
      hydrated: true,
    });
  },
  refresh: async () => {
    const snapshot = await loadSnapshot();
    set({ ...snapshot, t: dictionaries[snapshot.settings.locale], hydrated: true });
  },
  setLocale: async (locale) => {
    await data.setLocale(locale);
    await get().refresh();
  },
  updateSettings: async (patch) => {
    await data.updateSettings(patch);
    await get().refresh();
  },
  completeOnboarding: async () => {
    await data.completeOnboarding();
    await get().refresh();
  },
  resetOnboarding: async () => {
    await data.resetOnboarding();
    await get().refresh();
  },
  createSubject: async (input) => {
    await data.createSubject(input);
    await get().refresh();
  },
  updateSubject: async (id, input) => {
    await data.updateSubject(id, input);
    await get().refresh();
  },
  archiveSubject: async (id) => {
    await data.archiveSubject(id);
    await get().refresh();
  },
  createTag: async (input) => {
    await data.createTag(input);
    await get().refresh();
  },
  updateTag: async (id, input) => {
    await data.updateTag(id, input);
    await get().refresh();
  },
  archiveTag: async (id) => {
    await data.archiveTag(id);
    await get().refresh();
  },
  createOrUpdateDayPlan: async (date, plannedBlockCount, assignments) => {
    await data.createOrUpdateDayPlan(date, plannedBlockCount, assignments);
    await get().refresh();
  },
  startBlock: async (id) => {
    await data.startBlock(id);
    await get().refresh();
  },
  pauseBlock: async (id) => {
    await data.pauseBlock(id);
    await get().refresh();
  },
  completeBlock: async (id) => {
    await data.completeBlock(id);
    await get().refresh();
  },
  skipBlock: async (id) => {
    await data.skipBlock(id);
    await get().refresh();
  },
  updateBlockSubject: async (id, subjectId) => {
    await data.updateBlockSubject(id, subjectId);
    await get().refresh();
  },
  updateBlockTags: async (id, tagIds) => {
    await data.updateBlockTags(id, tagIds);
    await get().refresh();
  },
  updateBlockNote: async (id, note) => {
    await data.updateBlockNote(id, note);
    await get().refresh();
  },
  loadStats: async (filters) => {
    set({ stats: await data.getStats(filters) });
  },
  exportLocalData: data.exportLocalData,
  importLocalData: async (payload) => {
    await data.importLocalData(payload);
    await get().refresh();
  },
  resetLocalData: async () => {
    await data.resetLocalData();
    await get().initialize();
  },
}));
