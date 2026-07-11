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

  it("preserves newer typing when an older server acknowledgement arrives", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { rerender } = render(<BlockNoteEditor value="" onCommit={onCommit} placeholder="Note" />);

    const editor = screen.getByPlaceholderText<HTMLTextAreaElement>("Note");
    fireEvent.change(editor, { target: { value: "a" } });
    vi.advanceTimersByTime(900);
    expect(onCommit).toHaveBeenLastCalledWith("a");

    fireEvent.change(editor, { target: { value: "ab" } });
    rerender(<BlockNoteEditor value="a" onCommit={onCommit} placeholder="Note" />);

    expect(editor.value).toBe("ab");
    vi.advanceTimersByTime(900);
    expect(onCommit).toHaveBeenLastCalledWith("ab");
    expect(onCommit).toHaveBeenCalledTimes(2);
  });

  it("adopts an external value while the editor is clean", () => {
    const onCommit = vi.fn();
    const { rerender } = render(<BlockNoteEditor value="first" onCommit={onCommit} placeholder="Note" />);

    const editor = screen.getByPlaceholderText<HTMLTextAreaElement>("Note");
    rerender(<BlockNoteEditor value="remote update" onCommit={onCommit} placeholder="Note" />);

    expect(editor.value).toBe("remote update");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("still submits an unsaved draft when an external value happens to match it", () => {
    vi.useFakeTimers();
    const onCommit = vi.fn();
    const { rerender } = render(<BlockNoteEditor value="" onCommit={onCommit} placeholder="Note" />);

    fireEvent.change(screen.getByPlaceholderText("Note"), { target: { value: "matching draft" } });
    rerender(<BlockNoteEditor value="matching draft" onCommit={onCommit} placeholder="Note" />);
    vi.advanceTimersByTime(900);

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith("matching draft");
  });

  it("flushes the latest draft when unmounted", () => {
    const onCommit = vi.fn();
    const { unmount } = render(<BlockNoteEditor value="" onCommit={onCommit} placeholder="Note" />);

    fireEvent.change(screen.getByPlaceholderText("Note"), { target: { value: "save before closing" } });
    unmount();

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith("save before closing");
  });
});
