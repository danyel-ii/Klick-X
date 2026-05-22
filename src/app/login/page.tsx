"use client";

import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { dictionaries } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function safeNextPath() {
  if (typeof window === "undefined") return "/today";
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/today";
}

export default function LoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const copy = dictionaries[locale].login;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError(copy.invalid);
      return;
    }

    router.replace(safeNextPath());
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--app-border)] bg-[var(--card)] p-5 shadow-2xl shadow-slate-950/15">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-white">
              <LockKeyhole className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{copy.title}</h1>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{copy.subtitle}</p>
            </div>
          </div>
          <div className="flex rounded-full border border-[var(--app-border)] bg-[var(--surface)] p-1 text-xs font-bold">
            {(["en", "de"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={locale === item}
                onClick={() => setLocale(item)}
                className={`rounded-full px-2 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${locale === item ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)]"}`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.userId}
            <Input autoComplete="username" value={userId} onChange={(event) => setUserId(event.target.value)} required />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.password}
            <Input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? (
            <p className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-sm font-semibold text-[var(--destructive)]" aria-live="polite">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? copy.submitting : copy.submit}
          </Button>
        </form>
      </section>
    </main>
  );
}
