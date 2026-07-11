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
  const lastSubmittedRef = useRef(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const clearPendingCommit = useCallback(() => {
    if (timeoutRef.current === null) return;
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const commit = useCallback(
    (nextValue: string) => {
      clearPendingCommit();
      if (nextValue === lastSubmittedRef.current) return;
      lastSubmittedRef.current = nextValue;
      onCommitRef.current(nextValue);
    },
    [clearPendingCommit],
  );

  useEffect(() => {
    if (value === latestValueRef.current) return;
    const previousValue = latestValueRef.current;
    latestValueRef.current = value;

    if (value === draftRef.current) {
      return;
    }

    const editorWasClean = draftRef.current === previousValue && lastSubmittedRef.current === previousValue;
    if (!editorWasClean) return;

    lastSubmittedRef.current = value;
    draftRef.current = value;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === lastSubmittedRef.current) return;
    clearPendingCommit();
    timeoutRef.current = window.setTimeout(() => commit(draft), debounceMs);
    return clearPendingCommit;
  }, [clearPendingCommit, commit, debounceMs, draft]);

  useEffect(() => () => commit(draftRef.current), [commit]);

  return (
    <Textarea
      {...props}
      value={draft}
      onBlur={() => commit(draftRef.current)}
      onChange={(event) => {
        const nextValue = event.target.value;
        draftRef.current = nextValue;
        setDraft(nextValue);
      }}
    />
  );
}
