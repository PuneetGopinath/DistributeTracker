/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/helpers/indexedDB.js
 * License: MIT (see LICENSE)
 */

const DB_NAME = "quicklog";
const DB_VERSION = 2;

let dbPromise = null;

// One shared connection. Every store and index is created here and nowhere else.
export function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
            const db = req.result;
            const tx = req.transaction;

            const events = db.objectStoreNames.contains("events")
                ? tx.objectStore("events")
                : db.createObjectStore("events", { keyPath: "_id" });

            if (!events.indexNames.contains("synced")) events.createIndex("synced", "synced");
            if (!events.indexNames.contains("sessionId")) events.createIndex("sessionId", "sessionId");

            if (!db.objectStoreNames.contains("sessions")) db.createObjectStore("sessions", { keyPath: "_id" });
            if (!db.objectStoreNames.contains("items")) db.createObjectStore("items", { keyPath: "_id" });
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
            dbPromise = null;
            reject(req.error);
        };
    });

    return dbPromise;
}

// turns an IDBRequest into a promise
const wrap = (req) => new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

// resolves only when the transaction has really been committed
const finished = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
});

export function getDeviceId() {
    let id = localStorage.getItem("deviceId");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("deviceId", id);
    }
    return id;
}

const createSession = () => ({
    _id: crypto.randomUUID(),
    name: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    startedAt: Date.now(),
    endedAt: null,
});

// find and create happen in one transaction, so two calls can't create two sessions
export async function getActiveSession() {
    const db = await openDB();
    const tx = db.transaction("sessions", "readwrite");
    const store = tx.objectStore("sessions");

    const sessions = await wrap(store.getAll());
    const open = sessions.find(s => !s.endedAt);
    if (open) return open;

    const session = createSession();
    store.add(session);
    await finished(tx);
    return session;
}

export async function startNewSession() {
    const db = await openDB();
    const tx = db.transaction("sessions", "readwrite");
    const store = tx.objectStore("sessions");

    const sessions = await wrap(store.getAll());
    sessions.filter(s => !s.endedAt).forEach(s => store.put({ ...s, endedAt: Date.now() }));

    const session = createSession();
    store.add(session);
    await finished(tx);
    return session;
}

export async function getSessionEvents(sessionId) {
    const db = await openDB();
    const store = db.transaction("events").objectStore("events");
    return wrap(store.index("sessionId").getAll(sessionId));
}

export async function addEvent(event) {
    const db = await openDB();
    const tx = db.transaction("events", "readwrite");
    tx.objectStore("events").add(event);
    await finished(tx);
}

export async function getCachedItems() {
    const db = await openDB();
    return wrap(db.transaction("items").objectStore("items").getAll());
}

export async function cacheItems(items) {
    const db = await openDB();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");

    store.clear();
    items.forEach(item => store.put(item));
    await finished(tx);
}

// the count of an item is the sum of its deltas
export function getCounts(events) {
    const counts = {};
    events.forEach(e => {
        counts[e.itemId] = (counts[e.itemId] ?? 0) + e.delta;
    });
    return counts;
}
