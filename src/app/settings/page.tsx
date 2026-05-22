"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ArchiveRestore, Download, Pencil, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { Button, Input, PageHeader, SurfaceCard, TagPill, SubjectPill } from "@/components/ui";
import { useAppStore } from "@/lib/store";
import type { ExportPayload, Locale, StartOfWeek, Subject, Tag, Theme } from "@/lib/types";

const colors = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a", "#dc2626", "#d97706", "#0f766e", "#be123c"];

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
  const [subjectColor, setSubjectColor] = useState(colors[0]);
  const [tagName, setTagName] = useState("");
  const [tagDescription, setTagDescription] = useState("");
  const [tagColor, setTagColor] = useState(colors[2]);
  const [resetText, setResetText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const activeSubjects = subjects.filter((subject) => !subject.archivedAt);
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const archivedSubjects = subjects.filter((subject) => subject.archivedAt);
  const archivedTags = tags.filter((tag) => tag.archivedAt);

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
    const payload = JSON.parse(await file.text()) as ExportPayload;
    await importLocalData(payload);
    event.target.value = "";
  }

  return (
    <>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />
      <div className="grid gap-5 lg:grid-cols-2">
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label={t.settings.name} value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder={t.settings.name} className="flex-1" />
              <ColorSelect value={subjectColor} onChange={setSubjectColor} />
              <Button type="submit">{t.settings.addSubject}</Button>
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input aria-label={t.settings.name} value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder={t.settings.name} className="flex-1" />
              <ColorSelect value={tagColor} onChange={setTagColor} />
              <Button type="submit">{t.settings.addTag}</Button>
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
              <select value={settings?.locale ?? "en"} onChange={(event) => void setLocale(event.target.value as Locale)} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.theme}
              <select value={settings?.theme ?? "system"} onChange={(event) => void updateSettings({ theme: event.target.value as Theme })} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
                <option value="system">{t.settings.system}</option>
                <option value="light">{t.settings.light}</option>
                <option value="dark">{t.settings.dark}</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t.settings.startOfWeek}
              <select value={settings?.startOfWeek ?? "monday"} onChange={(event) => void updateSettings({ startOfWeek: event.target.value as StartOfWeek })} className="min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3">
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
              <Input type="number" min={30} value={settings?.screensaverDelaySeconds ?? 180} onChange={(event) => void updateSettings({ screensaverDelaySeconds: Number(event.target.value) })} />
            </label>
          </div>
          <Button variant="secondary" className="mt-5" onClick={() => void resetOnboarding()}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t.settings.replayOnboarding}
          </Button>
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
          <h3 className="mt-8 font-bold">{t.settings.advancedReset}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">{t.settings.resetConfirm}</p>
          <div className="mt-3 flex gap-2">
            <Input value={resetText} onChange={(event) => setResetText(event.target.value)} aria-label="Reset confirmation" />
            <Button variant="danger" disabled={resetText !== "RESET"} onClick={() => void resetLocalData()}>
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
  const [color, setColor] = useState(subject.color);

  function save() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
    setEditing(false);
  }

  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 ${archived ? "opacity-75" : ""}`}>
      {editing ? (
        <div className="grid gap-3">
          <Input aria-label={t.settings.name} value={name} onChange={(event) => setName(event.target.value)} />
          <ColorSelect value={color} onChange={setColor} />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SubjectPill subject={subject} />
          <div className="flex flex-wrap gap-2">
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
  const [color, setColor] = useState(tag.color);

  function save() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, description: description.trim() });
    setEditing(false);
  }

  return (
    <div className={`rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 ${archived ? "opacity-75" : ""}`}>
      {editing ? (
        <div className="grid gap-3">
          <Input aria-label={t.settings.name} value={name} onChange={(event) => setName(event.target.value)} />
          <Input aria-label={t.settings.description} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.settings.description} />
          <ColorSelect value={color} onChange={setColor} />
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <TagPill tag={tag} />
            {tag.description ? <p className="mt-2 text-sm text-[var(--muted)]">{tag.description}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
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

function ColorSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Color">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className="h-10 w-10 rounded-lg border border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}
