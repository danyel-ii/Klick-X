import { registerStudyServiceWorker } from "./service-worker";
import { formatDuration, visibleElapsedSeconds } from "./timer";
import type { Locale, StudyBlock, Subject, Tag } from "./types";

export function supportsLockScreenTimerNotifications() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function requestLockScreenNotificationPermission() {
  if (!supportsLockScreenTimerNotifications()) return false;
  const registration = await registerStudyServiceWorker();
  if (!registration) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

export async function clearLockScreenTimerNotification() {
  if (!supportsLockScreenTimerNotifications()) return;
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  registration?.active?.postMessage({ type: "STUDY_TIMER_CLEAR_NOTIFICATION" });
}

export async function syncLockScreenTimerNotification({
  block,
  subject,
  tags,
  locale,
  now = new Date(),
}: {
  block: StudyBlock;
  subject?: Subject;
  tags: Tag[];
  locale: Locale;
  now?: Date;
}) {
  if (!supportsLockScreenTimerNotifications() || Notification.permission !== "granted") return;

  const registration = await registerStudyServiceWorker();
  if (!registration) return;

  const elapsed = formatDuration(visibleElapsedSeconds(block, now));
  const subjectName = subject?.name ?? (locale === "de" ? "Unbekanntes Fach" : "Unknown subject");
  const elapsedLabel = locale === "de" ? "gelernt" : "elapsed";
  const body = tags.length ? tags.map((tag) => tag.name).join(" · ") : locale === "de" ? "Aktiver Lernblock" : "Active study block";

  registration.active?.postMessage({
    type: "STUDY_TIMER_SHOW_NOTIFICATION",
    payload: {
      blockId: block.id,
      title: `${subjectName} - ${elapsed} ${elapsedLabel}`,
      body,
      locale,
    } satisfies {
      blockId: string;
      title: string;
      body: string;
      locale: Locale;
    },
  });
}
