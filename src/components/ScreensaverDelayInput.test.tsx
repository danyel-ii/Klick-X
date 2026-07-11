// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScreensaverDelayInput } from "./ScreensaverDelayInput";

describe("ScreensaverDelayInput", () => {
  afterEach(cleanup);

  it("keeps rapid typing local and persists once on blur", () => {
    const onCommit = vi.fn();
    render(<ScreensaverDelayInput value={180} onCommit={onCommit} />);
    const input = screen.getByRole<HTMLInputElement>("spinbutton");

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "12" } });
    fireEvent.change(input, { target: { value: "120" } });
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith(120);
  });

  it("clamps and persists the draft when Enter is pressed", () => {
    const onCommit = vi.fn();
    render(<ScreensaverDelayInput value={180} onCommit={onCommit} />);
    const input = screen.getByRole<HTMLInputElement>("spinbutton");

    input.focus();
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith(30);
    expect(input.value).toBe("30");
    expect(input.getAttribute("min")).toBe("30");
    expect(input.getAttribute("max")).toBe("3600");
  });

  it("restores the persisted value instead of saving an empty draft", () => {
    const onCommit = vi.fn();
    render(<ScreensaverDelayInput value={180} onCommit={onCommit} />);
    const input = screen.getByRole<HTMLInputElement>("spinbutton");

    fireEvent.change(input, { target: { value: "" } });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    fireEvent.blur(input);

    expect(input.value).toBe("180");
    expect(onCommit).not.toHaveBeenCalled();
  });
});
