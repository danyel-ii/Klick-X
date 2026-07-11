// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BlockNoteEditor } from "./BlockNoteEditor";

describe("BlockNoteEditor", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps typing local and commits after the debounce", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<BlockNoteEditor value="" onCommit={onCommit} placeholder="Note" />);

    const editor = screen.getByPlaceholderText("Note");
    fireEvent.change(editor, { target: { value: "a" } });
    fireEvent.change(editor, { target: { value: "ab" } });
    fireEvent.change(editor, { target: { value: "abc" } });

    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(899);
    expect(onCommit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith("abc");
  });

  it("flushes the latest note on blur", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    render(<BlockNoteEditor value="" onCommit={onCommit} placeholder="Note" />);

    const editor = screen.getByPlaceholderText("Note");
    fireEvent.change(editor, { target: { value: "final note" } });
    fireEvent.blur(editor);

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenLastCalledWith("final note");

    vi.advanceTimersByTime(900);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
