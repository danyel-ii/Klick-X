"use client";

import { useEffect } from "react";
import { registerStudyServiceWorker } from "@/lib/service-worker";
import { useAppStore } from "@/lib/store";

export function ServiceWorkerRegistration() {
  const refresh = useAppStore((state) => state.refresh);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    void registerStudyServiceWorker();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "STUDY_BLOCKS_REFRESH") void refresh();
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [refresh]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const controllerChange = () => {
      void navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: "STUDY_BLOCKS_READY" }));
    };

    navigator.serviceWorker.addEventListener("controllerchange", controllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", controllerChange);
  }, []);

  return null;
}
