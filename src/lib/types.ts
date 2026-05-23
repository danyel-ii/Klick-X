import type { AppTheme } from "./themes";

export type Locale = "en" | "de";
export type Theme = AppTheme;
export type StartOfWeek = "monday" | "sunday";
export type StudyBlockStatus =
  | "planned"
  | "active"
  | "paused"
  | "completed"
  | "skipped";

export type Subject = {
  id: string;
  name: string;
  color: string;
  icon?: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  description?: string;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudyDay = {
  id: string;
  date: string;
  plannedBlockCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StudyBlock = {
  id: string;
  dayId: string;
  date: string;
  index: number;
  subjectId: string;
  tagIds: string[];
  status: StudyBlockStatus;
  plannedMinutes: number;
  elapsedSeconds: number;
  startedAt?: string | null;
  completedAt?: string | null;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type FractalParams = {
  date: string;
  dailyPomodoroCount: number;
  consecutivePomodoroStreak: number;
  overallStudyStreakDays: number;
  longestStudyStreakDays: number;
  subjectStreaks: Record<string, number>;
  tagStreaks: Record<string, number>;
  totalMinutesToday: number;
  completedBlocksToday: number;
  daysSinceLastUse: number;
  dominantSubjectId?: string;
  dominantSubjectColor: string;
  dominantTagIds: string[];
  dominantTagColors: string[];
  seed: string;
};

export type FractalBranchConfig = {
  angle: number;
  length: number;
  width: number;
  color: string;
};

export type FractalConfig = {
  seed: string;
  background: string[];
  palette: string[];
  depth: number;
  symmetry: number;
  rotation: number;
  curl: number;
  spread: number;
  branchScale: number;
  lineWidth: number;
  glow: number;
  rings: number;
  branches: FractalBranchConfig[];
};

export type DailyFractal = {
  id: string;
  date: string;
  seed: string;
  params: FractalParams;
  config: FractalConfig;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  id: "app";
  blockMinutes: number;
  theme: Theme;
  locale: Locale;
  onboardingCompletedAt?: string | null;
  onboardingVersion: number;
  startOfWeek: StartOfWeek;
  screensaverEnabled: boolean;
  screensaverDelaySeconds: number;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DayAssignment = {
  subjectId: string;
  tagIds: string[];
};

export type CalendarDaySummary = {
  date: string;
  plannedBlocks: number;
  completedBlocks: number;
  studiedSeconds: number;
};

export type StatsRange = "7d" | "30d" | "90d" | "all";

export type StatsFilters = {
  range: StatsRange;
  subjectId?: string;
  tagId?: string;
  noteQuery?: string;
};

export type BreakdownItem = {
  id: string;
  name: string;
  color: string;
  seconds: number;
  blocks: number;
};

export type TrendItem = {
  label: string;
  date: string;
  seconds: number;
  completedBlocks: number;
};

export type NoteResult = {
  block: StudyBlock;
  subject?: Subject;
  tags: Tag[];
};

export type StatsSummary = {
  totalSeconds: number;
  completedBlocks: number;
  plannedBlocks: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  averageSecondsPerActiveDay: number;
  averageBlocksPerActiveDay: number;
  timeBySubject: BreakdownItem[];
  timeByTag: BreakdownItem[];
  weeklyTrend: TrendItem[];
  monthlyTrend: TrendItem[];
  mostStudiedSubject?: BreakdownItem;
  mostUsedTag?: BreakdownItem;
  notes: NoteResult[];
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  subjects: Subject[];
  tags: Tag[];
  studyDays: StudyDay[];
  studyBlocks: StudyBlock[];
  dailyFractals: DailyFractal[];
  settings: AppSettings | null;
};

export type AppSnapshot = {
  settings: AppSettings;
  subjects: Subject[];
  tags: Tag[];
  today: StudyDay | null;
  todayBlocks: StudyBlock[];
  calendarSummary: CalendarDaySummary[];
  allDays: StudyDay[];
  allBlocks: StudyBlock[];
  dailyFractals: DailyFractal[];
};
