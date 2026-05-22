import {
  addDays,
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { Locale, StartOfWeek } from "./types";

export const dateFnsLocale = (locale: Locale) => (locale === "de" ? de : enUS);

export function localDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

export function formatDate(dateKey: string, locale: Locale, pattern = "PPP") {
  return format(parseISO(dateKey), pattern, { locale: dateFnsLocale(locale) });
}

export function calendarMonthDays(monthDate: Date, start: StartOfWeek) {
  const weekStartsOn = start === "monday" ? 1 : 0;
  const first = startOfWeek(startOfMonth(monthDate), { weekStartsOn });
  return Array.from({ length: 42 }, (_, index) => addDays(first, index));
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function rangeStart(range: "7d" | "30d" | "90d" | "all", today = new Date()) {
  if (range === "all") return null;
  const days = range === "7d" ? 6 : range === "30d" ? 29 : 89;
  return localDateKey(subDays(today, days));
}

export function daysBetweenInclusive(startKey: string, endKey: string) {
  const start = parseISO(startKey);
  const end = parseISO(endKey);
  const count = differenceInCalendarDays(end, start);
  return Array.from({ length: count + 1 }, (_, index) => localDateKey(addDays(start, index)));
}
