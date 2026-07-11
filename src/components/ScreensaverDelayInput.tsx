"use client";

import { useState } from "react";
import { Input } from "./ui";

const MIN_DELAY_SECONDS = 30;
const MAX_DELAY_SECONDS = 3600;

export function ScreensaverDelayInput({ value, onCommit }: { value: number; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const parsedDraft = Number(draft);
  const draftIsValid = draft.trim() !== "" && Number.isInteger(parsedDraft) && parsedDraft >= MIN_DELAY_SECONDS && parsedDraft <= MAX_DELAY_SECONDS;

  function commit() {
    if (draft.trim() === "" || !Number.isFinite(parsedDraft)) {
      setDraft(String(value));
      return;
    }

    const nextValue = Math.min(MAX_DELAY_SECONDS, Math.max(MIN_DELAY_SECONDS, Math.round(parsedDraft)));
    setDraft(String(nextValue));
    if (nextValue !== value) onCommit(nextValue);
  }

  return (
    <Input
      type="number"
      min={MIN_DELAY_SECONDS}
      max={MAX_DELAY_SECONDS}
      step={1}
      value={draft}
      aria-invalid={!draftIsValid}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        event.currentTarget.blur();
      }}
    />
  );
}
