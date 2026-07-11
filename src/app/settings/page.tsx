"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArchiveRestore, BellRing, Download, LogOut, Pencil, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { ScreensaverDelayInput } from "@/components/ScreensaverDelayInput";
import { Button, Input, PageHeader, SurfaceCard, TagPill, SubjectPill } from "@/components/ui";
import { resolveSubjectColor, resolveTagColor, subjectColorOptions, tagThemeColorOptions, tagThemeColorValues } from "@/lib/colors";
import { requestLockScreenNotificationPermission, supportsLockScreenTimerNotifications } from "@/lib/lock-screen-notifications";
import { useAppStore } from "@/lib/store";
import { daisyThemes, formatThemeName } from "@/lib/themes";
import type { ExportPayload, Locale, StartOfWeek, Subject, Tag, Theme } from "@/lib/types";

export default function SettingsPage() {
  const {
    t,
    settings,
    subjects,
    tags,
    setLocale,
    updateSettings,
    createSubject,
    updateSubject,
    deleteSubject,
    restoreSubject,
    createTag,
    updateTag,
    deleteTag,
    restoreTag,
    resetOnboarding,
    exportLocalData,
    importLocalData,
    resetLocalData,
  } = useAppStore();
  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState<string>(subjectColorOptions[0].value);
  const [tagName, setTagName] = useState("");
  const [tagDescription, setTagDescription] = useState("");
  const [tagColor, setTagColor] = useState<string>(tagThemeColorValues[0]);
  const [resetText, setResetText] = useState("");
  const [importError, setImportError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const archivedSubjects = subjects.filter((subject) => subject.archivedAt);
  const archivedTags = tags.filter((tag) => tag.archivedAt);
  const screensaverDelay = settings?.screensaverDelaySeconds ?? 180;

  async function handleExport() {
    const payload = await exportLocalData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `study-blocks-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError("");
    try {
      const payload = JSON.parse(await file.text()) as ExportPayload;
      await importLocalData(payload);
    } catch {
      setImportError(t.settings.importFailed);
    } finally {
      event.target.value = "";
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  async function handleLockScreenControlsChange(enabled: boolean) {
    setNotificationError("");
    if (!enabled) {
      await updateSettings({ notificationsEnabled: false });
      return;
    }

    if (!supportsLockScreenTimerNotifications()) {
      setNotificationError(t.settings.lockScreenTimerControlsUnsupported);
      return;
    }

    const granted = await requestLockScreenNotificationPermission();
    if (!granted) {
      setNotificationError(t.settings.notificationPermissionDenied);
      return;
    }

    await updateSettings({ notificationsEnabled: true });
  }

  return (
    <>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <SurfaceCard>
          <h2 className="text-lg font-bold">{t.settings.subjects}</h2>
          <form
            className="mt-4 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!subjectName.trim()) return;
              void createSubject({ name: subjectName.trim(), color: subjectColor });
              setSubjectName("");
            }}
          >
            <div className="flex min-w-0 flex-wrap items-start gap-2">
              <Input aria-label={t.settings.name} value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder={t.settings.name} className="min-w-44 flex-1 basis-60" />
              <ColorSelect value={subjectColor} onChange={setSubjectColor} options={subjectColorOptions} resolveColor={resolveSubjectColor} />
              <Button type="submit" className="shrink-0 whitespace-nowrap">
                {t.settings.addSubject}
              </Button>
            </div>
          </form>
          <div className="mt-4 grid gap-2">
            {activeSubjects.length ? (
              activeSubjects.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  onSave={(patch) => void updateSubject(subject.id, patch)}
                  onDelete={() => {
                    if (window.confirm(t.settings.deleteSubjectConfirm)) void deleteSubject(subject.id);
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">{t.settings.emptySubjects}</p>
            )}
          </div>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">{t.settings.archivedSubjects}</summary>
            <div className="mt-3 grid gap-2">
              {archivedSubjects.length ? (
                archivedSubjects.map((subject) => (
                  <SubjectRow
                    key={subject.id}
                    subject={subject}
                    archived
                    onSave={(patch) => void updateSubject(subject.id, patch)}
                    onRestore={() => void restoreSubject(subject.id)}
                    onDelete={() => {
                      if (window.confirm(t.settings.permanentDeleteSubjectConfirm)) void deleteSubject(subject.id, true);
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">{t.settings.emptyArchivedSubjects}</p>
              )}
            </div>
          </details>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-lg font-bold">{t.settings.tags}</h2>
          <form
            className="mt-4 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!tagName.trim()) return;
              void createTag({ name: tagName.trim(), color: tagColor, description: tagDescription.trim() });
              setTagName("");
              setTagDescription("");
            }}
          >
            <div className="flex min-w-0 flex-wrap items-start gap-2">
              <Input aria-label={t.settings.name} value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder={t.settings.name} className="min-w-44 flex-1 basis-60" />
              <ColorSelect value={tagColor} onChange={setTagColor} options={tagThemeColorOptions} resolveColor={resolveTagColor} />
              <Button type="submit" className="shrink-0 whitespace-nowrap">
                {t.settings.addTag}
              </Button>
            </div>
            <Input aria-label={t.settings.description} value={tagDescription} onChange={(event) => setTagDescription(event.target.value)} placeholder={t.settings.description} />
          </form>
          <div className="mt-4 grid gap-2">
            {activeTags.length ? (
              activeTags.map((tag) => (
                <TagRow
                  key={tag.id}
                  tag={tag}
                  onSave={(patch) => void updateTag(tag.id, patch)}
                  onDelete={() => {
                    if (window.confirm(t.settings.deleteTagConfirm)) void deleteTag(tag.id);
                  }}
                />
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">{t.settings.emptyTags}</p>
            )}
          </div>
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--muted)]">{t.settings.archivedTags}</summary>
            <div className="mt-3 grid gap-2">
              {archivedTags.length ? (
                archivedTags.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    archived
                    onSave={(patch) => void updateTag(tag.id, patch)}
                    onRestore={() => void restoreTag(tag.id)}
                    onDelete={() => {
                      if (window.confirm(t.settings.permanentDeleteTagConfirm)) void deleteTag(tag.id, true);
                    }}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">{t.settings.emptyArchivedTags}</p>
              )}
            </div>
          </details>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-lg font-bold">{t.settings.language}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.language}
              <select value={settings?.locale ?? "en"} onChange={(event) => void setLocale(event.target.value as Locale)} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.theme}
              <select value={settings?.theme ?? "system"} onChange={(event) => void updateSettings({ theme: event.target.value as Theme })} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
                <option value="system">{t.settings.system}</option>
                {daisyThemes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme === "light" ? t.settings.light : theme === "dark" ? t.settings.dark : formatThemeName(theme)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.startOfWeek}
              <select value={settings?.startOfWeek ?? "monday"} onChange={(event) => void updateSettings({ startOfWeek: event.target.value as StartOfWeek })} className="min-h-11 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 shadow-inner shadow-slate-950/5">
                <option value="monday">{t.settings.monday}</option>
                <option value="sunday">{t.settings.sunday}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={settings?.screensaverEnabled ?? true} onChange={(event) => void updateSettings({ screensaverEnabled: event.target.checked })} />
              {t.settings.screensaver}
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.delay}
              <ScreensaverDelayInput
                key={screensaverDelay}
                value={screensaverDelay}
                onCommit={(value) => void updateSettings({ screensaverDelaySeconds: value })}
              />
            </label>
            <label className="flex items-start gap-3 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={settings?.timerBeepEnabled ?? true}
                onChange={(event) => void updateSettings({ timerBeepEnabled: event.target.checked })}
              />
              <span>
                <span>{t.settings.timerBeep}</span>
                <span className="mt-1 block text-xs leading-5 font-normal text-[var(--muted)]">{t.settings.timerBeepHint}</span>
              </span>
            </label>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settings?.notificationsEnabled ?? false}
                  onChange={(event) => void handleLockScreenControlsChange(event.target.checked)}
                />
                <span>
                  <span className="flex items-center gap-2">
                    <BellRing className="h-4 w-4" aria-hidden />
                    {t.settings.lockScreenTimerControls}
                  </span>
                  <span className="mt-1 block text-xs leading-5 font-normal text-[var(--muted)]">{t.settings.lockScreenTimerControlsHint}</span>
                </span>
              </label>
              {notificationError ? <p className="mt-2 text-sm font-semibold text-[var(--destructive)]">{notificationError}</p> : null}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void resetOnboarding()}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t.settings.replayOnboarding}
            </Button>
            <Button variant="secondary" onClick={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" aria-hidden />
              {t.settings.signOut}
            </Button>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <h2 className="text-lg font-bold">{t.settings.importExport}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void handleExport()}>
              <Download className="h-4 w-4" aria-hidden />
              {t.actions.export}
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden />
              {t.actions.import}
            </Button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => void handleImport(event)} />
          </div>
          {importError ? <p className="mt-3 text-sm font-semibold text-[var(--destructive)]">{importError}</p> : null}
          <h3 className="mt-8 font-bold">{t.settings.advancedReset}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.settings.resetConfirm}</p>
          <div className="mt-3 flex min-w-0 flex-wrap gap-2">
            <Input value={resetText} onChange={(event) => setResetText(event.target.value)} aria-label="Reset confirmation" className="min-w-44 flex-1 basis-52" />
            <Button
              variant="danger"
              disabled={resetText !== "RESET"}
              onClick={() => {
                void resetLocalData().then(() => setResetText(""));
              }}
              className="shrink-0 whitespace-nowrap"
            >
              {t.actions.reset}
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}

function SubjectRow({
  subject,
  archived,
  onSave,
  onDelete,
  onRestore,
}: {
  subject: Subject;
  archived?: boolean;
  onSave: (patch: Pick<Subject, "name" | "color">) => void;
  onDelete: () => void;
  onRestore?: () => void;
}) {
  const { t } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(subject.name);
  const [color, setColor] = useState(resolveSubjectColor(subject.color));

  function save() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    setEditing(false);
  }

  return (
    <div className={`liquid-glass rounded-2xl p-3 ${archived ? "opacity-75" : ""}`}>
      {editing ? (
        <div className="grid gap-3">
          <Input aria-label={t.settings.name} value={name} onChange={(event) => setName(event.target.value)} />
          <ColorSelect value={color} onChange={setColor} options={subjectColorOptions} resolveColor={resolveSubjectColor} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save}>
              {t.actions.save}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" aria-hidden />
              {t.actions.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SubjectPill subject={subject} />
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t.actions.edit}
            </Button>
            {archived && onRestore ? (
              <Button type="button" variant="secondary" onClick={onRestore}>
                <ArchiveRestore className="h-4 w-4" aria-hidden />
                {t.settings.restore}
              </Button>
            ) : null}
            <Button type="button" variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {archived ? t.settings.permanentDelete : t.settings.deleteSubject}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TagRow({
  tag,
  archived,
  onSave,
  onDelete,
  onRestore,
}: {
  tag: Tag;
  archived?: boolean;
  onSave: (patch: Pick<Tag, "name" | "color" | "description">) => void;
  onDelete: () => void;
  onRestore?: () => void;
}) {
  const { t } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tag.name);
  const [description, setDescription] = useState(tag.description ?? "");
  const [color, setColor] = useState(resolveTagColor(tag.color));

  function save() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, description: description.trim() });
    setEditing(false);
  }

  return (
    <div className={`liquid-glass rounded-2xl p-3 ${archived ? "opacity-75" : ""}`}>
      {editing ? (
        <div className="grid gap-3">
          <Input aria-label={t.settings.name} value={name} onChange={(event) => setName(event.target.value)} />
          <Input aria-label={t.settings.description} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.settings.description} />
          <ColorSelect value={color} onChange={setColor} options={tagThemeColorOptions} resolveColor={resolveTagColor} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save}>
              {t.actions.save}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" aria-hidden />
              {t.actions.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <TagPill tag={tag} />
            {tag.description ? <p className="mt-2 text-sm text-[var(--muted)]">{tag.description}</p> : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden />
              {t.actions.edit}
            </Button>
            {archived && onRestore ? (
              <Button type="button" variant="secondary" onClick={onRestore}>
                <ArchiveRestore className="h-4 w-4" aria-hidden />
                {t.settings.restore}
              </Button>
            ) : null}
            <Button type="button" variant="danger" onClick={onDelete}>
              <Trash2 className="h-4 w-4" aria-hidden />
              {archived ? t.settings.permanentDelete : t.settings.deleteTag}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColorSelect({
  value,
  onChange,
  options,
  resolveColor = (color: string) => color,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  resolveColor?: (value: string) => string;
}) {
  const resolvedValue = resolveColor(value);
  return (
    <div className="flex min-w-0 max-w-full flex-wrap gap-1" role="radiogroup" aria-label="Color">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={resolvedValue === option.value}
          title={option.label}
          onClick={() => onChange(option.value)}
          className="soft-shimmer h-10 w-10 shrink-0 rounded-2xl border border-[var(--app-border)] shadow-sm shadow-slate-950/10 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={{ backgroundColor: resolveColor(option.value) }}
        />
      ))}
    </div>
  );
}
