"use client";

import { clsx } from "clsx";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
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
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white shadow-sm hover:brightness-95",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)]",
        variant === "ghost" && "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
        variant === "danger" && "bg-[var(--destructive)] text-white hover:brightness-95",
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
        "min-h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)]",
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
        "min-h-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:ring-2 focus:ring-[var(--ring)]",
        props.className,
      )}
    />
  );
}

export function SurfaceCard({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx("rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm", className)}>{children}</section>;
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
  const content = (
    <>
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
      <span className="truncate">{subject.name}</span>
    </>
  );
  if (!onClick) {
    return <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-sm">{content}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        selected ? "border-transparent text-white shadow-sm" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)]",
      )}
      style={selected ? { backgroundColor: subject.color } : undefined}
    >
      {content}
    </button>
  );
}

export function TagPill({ tag, selected, onClick }: { tag: Tag; selected?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
      <span className="truncate">{tag.name}</span>
    </>
  );
  if (!onClick) {
    return <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--surface-elevated)] px-2.5 py-1 text-xs">{content}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        selected ? "border-transparent text-white" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-elevated)]",
      )}
      style={selected ? { backgroundColor: tag.color } : undefined}
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
      className="grid h-36 w-36 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--accent) ${degrees}deg, var(--surface-elevated) 0deg)` }}
      aria-label={`${formatDuration(elapsed)} elapsed`}
    >
      <div className="grid h-28 w-28 place-items-center rounded-full bg-[var(--card)] text-center shadow-inner">
        <div>
          <div className="font-mono text-2xl font-bold">{formatDuration(elapsed)}</div>
          <div className="text-xs text-[var(--muted)]">{block.plannedMinutes}m</div>
        </div>
      </div>
    </div>
  );
}
