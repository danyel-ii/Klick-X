let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export async function registerStudyServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;

  registrationPromise ??= Promise.resolve()
    .then(() => navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }))
    .catch(() => {
      registrationPromise = null;
      return null;
    });
  return registrationPromise;
}
