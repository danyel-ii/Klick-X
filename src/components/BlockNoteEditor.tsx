"use client";

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { Textarea } from "./ui";

type BlockNoteEditorProps = Omit<ComponentPropsWithoutRef<typeof Textarea>, "value" | "defaultValue" | "onChange" | "onBlur"> & {
  value: string;
  onCommit: (value: string) => void;
  debounceMs?: number;
};

export function BlockNoteEditor({ value, onCommit, debounceMs = 900, ...props }: BlockNoteEditorProps) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const latestValueRef = useRef(value);
  const lastCommittedRef = useRef(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const clearPendingCommit = useCallback(() => {
    if (!timeoutRef.current) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const commit = useCallback(
    (nextValue: string) => {
      clearPendingCommit();
      if (nextValue === lastCommittedRef.current) return;
      lastCommittedRef.current = nextValue;
      onCommitRef.current(nextValue);
    },
    [clearPendingCommit],
  );

  useEffect(() => {
    if (value === latestValueRef.current) return;
    latestValueRef.current = value;
    lastCommittedRef.current = value;
    draftRef.current = value;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === lastCommittedRef.current) return;
    clearPendingCommit();
    timeoutRef.current = window.setTimeout(() => commit(draft), debounceMs);
    return clearPendingCommit;
  }, [clearPendingCommit, commit, debounceMs, draft]);

  useEffect(() => () => commit(draftRef.current), [commit]);

  return (
    <Textarea
      {...props}
      value={draft}
      onBlur={() => commit(draft)}
      onChange={(event) => {
        draftRef.current = event.target.value;
        setDraft(event.target.value);
      }}
    />
  );
}
