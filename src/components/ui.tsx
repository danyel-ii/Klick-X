"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { resolveSubjectColor, resolveSubjectTextColor, resolveTagColor, resolveTagTextColor } from "@/lib/colors";
import type { StudyBlock, Subject, Tag } from "@/lib/types";
import { formatDuration, visibleElapsedSeconds } from "@/lib/timer";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={clsx(
        "soft-shimmer inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        "hover:-translate-y-0.5 active:translate-y-0",
        variant === "primary" && "bg-[var(--accent)] text-[var(--color-primary-content)] shadow-[0_14px_32px_color-mix(in_srgb,var(--accent)_24%,transparent)] hover:brightness-105",
        variant === "secondary" && "liquid-glass text-[var(--foreground)] hover:bg-[var(--glass-strong)]",
        variant === "ghost" && "text-[var(--muted)] hover:bg-[var(--glass)] hover:text-[var(--foreground)]",
        variant === "danger" && "bg-[var(--destructive)] text-[var(--color-error-content)] shadow-[0_14px_32px_color-mix(in_srgb,var(--destructive)_22%,transparent)] hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "min-h-11 w-full min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 text-sm text-[var(--foreground)] shadow-inner shadow-slate-950/5 outline-none transition placeholder:text-[var(--muted)] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        "min-h-24 w-full min-w-0 rounded-2xl border border-[var(--app-border)] bg-[var(--glass)] px-4 py-3 text-sm leading-6 text-[var(--foreground)] shadow-inner shadow-slate-950/5 outline-none transition placeholder:text-[var(--muted)] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function SurfaceCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx("liquid-glass min-w-0 rounded-3xl p-4 sm:p-5", className)}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-[var(--foreground)] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SubjectPill({
  subject,
  selected,
  onClick,
}: {
  subject: Subject;
  selected?: boolean;
  onClick?: () => void;
}) {
  const subjectColor = resolveSubjectColor(subject.color);
  const subjectTextColor = resolveSubjectTextColor(subject.color);
  const content = (
    <>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subjectColor }} />
      <span className="min-w-0 truncate">{subject.name}</span>
    </>
  );
  if (!onClick) {
    return <span className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--glass)] px-3 py-1.5 text-sm shadow-sm shadow-slate-950/5">{content}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "soft-shimmer inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm shadow-slate-950/5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        selected ? "border-transparent text-white" : "border-[var(--app-border)] bg-[var(--glass)] hover:-translate-y-0.5 hover:bg-[var(--glass-strong)]",
      )}
      style={selected ? { backgroundColor: subjectColor, color: subjectTextColor } : undefined}
    >
      {content}
    </button>
  );
}

export function TagPill({ tag, selected, onClick }: { tag: Tag; selected?: boolean; onClick?: () => void }) {
  const tagColor = resolveTagColor(tag.color);
  const tagTextColor = resolveTagTextColor(tag.color);
  const content = (
    <>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tagColor }} />
      <span className="min-w-0 truncate">{tag.name}</span>
    </>
  );
  if (!onClick) {
    return <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--glass)] px-2.5 py-1 text-xs shadow-sm shadow-slate-950/5">{content}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "soft-shimmer inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm shadow-slate-950/5 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        selected ? "border-transparent text-white" : "border-[var(--app-border)] bg-[var(--glass)] hover:-translate-y-0.5 hover:bg-[var(--glass-strong)]",
      )}
      style={selected ? { backgroundColor: tagColor, color: tagTextColor } : undefined}
    >
      {content}
    </button>
  );
}

export function TimerRing({ block, now }: { block: StudyBlock; now: Date }) {
  const elapsed = visibleElapsedSeconds(block, now);
  const target = block.plannedMinutes * 60;
  const progress = Math.min(1, elapsed / target);
  const degrees = progress * 360;
  return (
    <div
      className="grid h-36 w-36 place-items-center rounded-full shadow-[0_20px_50px_color-mix(in_srgb,var(--accent)_18%,transparent)]"
      style={{ background: `conic-gradient(var(--accent) ${degrees}deg, var(--surface-elevated) 0deg)` }}
      aria-label={`${formatDuration(elapsed)} elapsed`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[var(--glass-strong)] text-center shadow-inner backdrop-blur">
        <div>
          <div className="font-mono text-2xl font-bold">{formatDuration(elapsed)}</div>
          <div className="text-xs text-[var(--muted)]">{block.plannedMinutes}m</div>
        </div>
      </div>
    </div>
  );
}
