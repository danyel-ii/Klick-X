import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

type NotificationAction = "pause" | "complete";
type NotificationUpdate = (blockId: string, action: NotificationAction) => Promise<boolean>;

function loadWorkerScript() {
  const context: Record<string, unknown> = {
    self: { addEventListener: vi.fn() },
  };
  createContext(context);
  runInContext(readFileSync(join(process.cwd(), "public/sw.js"), "utf8"), context);
  return context;
}

describe("registerStudyServiceWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("reuses one registration across repeated notification syncs", async () => {
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(registration);
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { registerStudyServiceWorker } = await import("./service-worker");

    const [first, second] = await Promise.all([registerStudyServiceWorker(), registerStudyServiceWorker()]);
    const third = await registerStudyServiceWorker();

    expect(first).toBe(registration);
    expect(second).toBe(registration);
    expect(third).toBe(registration);
    expect(register).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledWith("/sw.js", { updateViaCache: "none" });
  });

  it("allows a later retry after registration fails", async () => {
    const registration = {} as ServiceWorkerRegistration;
    const register = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(registration);
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    const { registerStudyServiceWorker } = await import("./service-worker");

    await expect(registerStudyServiceWorker()).resolves.toBeNull();
    await expect(registerStudyServiceWorker()).resolves.toBe(registration);
    expect(register).toHaveBeenCalledTimes(2);
  });

  it("updates the server before using the local notification fallback", async () => {
    const context = loadWorkerScript();
    const updateBlock = context.updateBlockFromNotification as NotificationUpdate;
    const remoteUpdate = vi.fn().mockResolvedValue({ blocks: [{ id: "block-1" }] });
    const cacheRemoteBlocks = vi.fn().mockResolvedValue(undefined);
    const localUpdate = vi.fn().mockResolvedValue(true);
    const clearNotifications = vi.fn().mockResolvedValue(undefined);
    context.updateRemoteBlockFromNotification = remoteUpdate;
    context.cacheRemoteBlocks = cacheRemoteBlocks;
    context.updateLocalBlockFromNotification = localUpdate;
    context.clearTimerNotifications = clearNotifications;

    await expect(updateBlock("block-1", "pause")).resolves.toBe(true);
    expect(remoteUpdate).toHaveBeenCalledWith("block-1", "pause");
    expect(cacheRemoteBlocks).toHaveBeenCalledWith([{ id: "block-1" }]);
    expect(clearNotifications).toHaveBeenCalledOnce();
    expect(localUpdate).not.toHaveBeenCalled();
  });

  it("uses IndexedDB when the notification request cannot reach the server", async () => {
    const context = loadWorkerScript();
    const updateBlock = context.updateBlockFromNotification as NotificationUpdate;
    const remoteUpdate = vi.fn().mockResolvedValue(null);
    const localUpdate = vi.fn().mockResolvedValue(true);
    context.updateRemoteBlockFromNotification = remoteUpdate;
    context.updateLocalBlockFromNotification = localUpdate;

    await expect(updateBlock("block-1", "complete")).resolves.toBe(true);
    expect(remoteUpdate).toHaveBeenCalledWith("block-1", "complete");
    expect(localUpdate).toHaveBeenCalledWith("block-1", "complete");
  });
});
