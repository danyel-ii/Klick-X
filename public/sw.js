const CACHE_VERSION = "study-blocks-v7-klick-x-icon";
const APP_SHELL = [
  "/login",
  "/manifest.webmanifest?v=klick-x-icon-20260716",
  "/icon.png?v=klick-x-20260716",
  "/icons/icon-192-grayscale.png?v=klick-x-20260716",
  "/icons/icon-512-grayscale.png?v=klick-x-20260716",
  "/icons/maskable-512-grayscale.png?v=klick-x-20260716",
];
const DATABASE_NAME = "study-blocks";
const TIMER_NOTIFICATION_TAG = "study-blocks-active-timer";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/login").then((cached) => cached ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && ["image", "font"].includes(request.destination)) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }),
  );
});

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;

  if (message.type === "STUDY_TIMER_SHOW_NOTIFICATION") {
    event.waitUntil(showTimerNotification(message.payload));
  }

  if (message.type === "STUDY_TIMER_CLEAR_NOTIFICATION") {
    event.waitUntil(clearTimerNotifications());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const blockId = event.notification.data?.blockId;
  const action = event.action;

  event.waitUntil(
    (async () => {
      if (blockId && (action === "pause" || action === "complete")) {
        await updateBlockFromNotification(blockId, action);
        await notifyClientsToRefresh();
        return;
      }

      await openOrFocusToday();
    })(),
  );
});

async function showTimerNotification(payload) {
  if (!payload?.blockId || !payload?.title) return;

  const locale = payload.locale === "de" ? "de" : "en";
  await self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: TIMER_NOTIFICATION_TAG,
    renotify: false,
    requireInteraction: true,
    silent: true,
    badge: "/icons/icon-192-grayscale.png?v=klick-x-20260716",
    icon: "/icons/icon-192-grayscale.png?v=klick-x-20260716",
    data: {
      blockId: payload.blockId,
      url: "/today",
    },
    actions: [
      { action: "pause", title: locale === "de" ? "Pausieren" : "Pause" },
      { action: "complete", title: locale === "de" ? "Abschließen" : "Complete" },
    ],
  });
}

async function clearTimerNotifications() {
  const notifications = await self.registration.getNotifications({ tag: TIMER_NOTIFICATION_TAG });
  notifications.forEach((notification) => notification.close());
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB open was blocked."));
    request.onsuccess = () => resolve(request.result);
  });
}

function getObjectStore(database, storeName, mode) {
  const transaction = database.transaction(storeName, mode);
  return {
    store: transaction.objectStore(storeName),
    done: new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    }),
  };
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function secondsSince(startedAt, now) {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
}

function accumulateElapsed(block, now) {
  return block.startedAt ? block.elapsedSeconds + secondsSince(block.startedAt, now) : block.elapsedSeconds;
}

async function updateBlockFromNotification(blockId, action) {
  const remoteResult = await updateRemoteBlockFromNotification(blockId, action);
  if (remoteResult) {
    await cacheRemoteBlocks(remoteResult.blocks).catch(() => undefined);
    await clearTimerNotifications();
    return true;
  }

  return updateLocalBlockFromNotification(blockId, action);
}

async function cacheRemoteBlocks(blocks) {
  if (!blocks.length) return;
  const database = await openDatabase();

  try {
    const { store, done } = getObjectStore(database, "studyBlocks", "readwrite");
    blocks.forEach((block) => store.put(block));
    await done;
  } finally {
    database.close();
  }
}

async function updateLocalBlockFromNotification(blockId, action) {
  const database = await openDatabase();
  const now = new Date();

  try {
    const { store, done } = getObjectStore(database, "studyBlocks", "readwrite");
    const block = await requestToPromise(store.get(blockId));
    if (!block) return false;

    const nextBlock = {
      ...block,
      status: action === "complete" ? "completed" : "paused",
      elapsedSeconds: accumulateElapsed(block, now),
      startedAt: null,
      completedAt: action === "complete" ? now.toISOString() : block.completedAt ?? null,
      updatedAt: now.toISOString(),
    };

    store.put(nextBlock);
    await done;
    await clearTimerNotifications();
    return true;
  } finally {
    database.close();
  }
}

async function updateRemoteBlockFromNotification(blockId, action) {
  const apiAction = action === "complete" ? "completeBlock" : "pauseBlock";
  const response = await fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: apiAction, payload: { id: blockId } }),
  }).catch(() => null);

  if (!response?.ok) return null;

  const payload = await response.json().catch(() => null);
  return {
    blocks: Array.isArray(payload?.blocks) ? payload.blocks : [],
  };
}

async function notifyClientsToRefresh() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "STUDY_BLOCKS_REFRESH" }));
}

async function openOrFocusToday() {
  const appClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  const todayUrl = new URL("/today", self.location.origin).href;
  const existing = appClients.find((client) => "focus" in client && new URL(client.url).origin === self.location.origin);

  if (existing) {
    await existing.focus();
    existing.postMessage({ type: "STUDY_BLOCKS_REFRESH" });
    return;
  }

  if (self.clients.openWindow) await self.clients.openWindow(todayUrl);
}
