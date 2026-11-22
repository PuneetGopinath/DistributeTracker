/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/QuickLog.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";

import axios from "axios";

const DB_NAME = "quicklog";
const DB_VERSION = 2;

let dbPromise = null;

// One shared connection. Every store and index is created here and nowhere else.
function openDB() {
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

function getDeviceId() {
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
async function getActiveSession() {
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

async function startNewSession() {
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

async function getSessionEvents(sessionId) {
    const db = await openDB();
    const store = db.transaction("events").objectStore("events");
    return wrap(store.index("sessionId").getAll(sessionId));
}

async function addEvent(event) {
    const db = await openDB();
    const tx = db.transaction("events", "readwrite");
    tx.objectStore("events").add(event);
    await finished(tx);
}

async function getCachedItems() {
    const db = await openDB();
    return wrap(db.transaction("items").objectStore("items").getAll());
}

async function cacheItems(items) {
    const db = await openDB();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");

    store.clear();
    items.forEach(item => store.put(item));
    await finished(tx);
}

// the count of an item is the sum of its deltas
function getCounts(events) {
    const counts = {};
    events.forEach(e => {
        counts[e.itemId] = (counts[e.itemId] ?? 0) + e.delta;
    });
    return counts;
}

export default function QuickLog({ signedIn }) {
    const [items, setItems] = useState([]);
    const [session, setSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");

    const counts = useMemo(() => getCounts(events), [events]);
    const undone = useMemo(() => new Set(events.filter(e => e.reverses).map(e => e.reverses)), [events]);

    // local data first, so the screen works without a network
    useEffect(() => {
        if (!signedIn) return;
        let cancelled = false;

        (async () => {
            try {
                navigator.storage?.persist?.();

                const [cached, active] = await Promise.all([getCachedItems(), getActiveSession()]);
                const sessionEvents = await getSessionEvents(active._id);
                if (cancelled) return;

                setItems(prev => (prev.length > 0 ? prev : cached));
                setSession(active);
                setEvents(sessionEvents);
            } catch (err) {
                console.error("[ERROR] Failed to load local data:", err);
                setError("Could not open local storage. Your taps may not be saved.");
            }
        })();

        return () => { cancelled = true; };
    }, [signedIn]);

    // then try to refresh the item list from the server
    useEffect(() => {
        if (!signedIn) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/items", { signal: controller.signal, withCredentials: true });
                setItems(res.data);
                await cacheItems(res.data);
            } catch (err) {
                if (!axios.isCancel(err)) console.error("[ERROR] Could not fetch items, using the saved list:", err);
            }
        })();

        return () => controller.abort();
    }, [signedIn]);

    async function logEvent(itemId, action, delta, reverses) {
        const event = {
            _id: crypto.randomUUID(),
            sessionId: session._id,
            deviceId: getDeviceId(),
            itemId,
            action,
            delta,
            ts: Date.now(),
            synced: 0,
            ...(reverses && { reverses }),
        };

        try {
            await addEvent(event);
            setEvents(prev => [...prev, event]);
            setError("");
        } catch (err) {
            console.error("[ERROR] Failed to save event:", err);
            setError("That tap was not saved. Please try again.");
        }
    }

    function add(item) {
        if (session) logEvent(item._id, "add", 1);
    }

    function sub(item) {
        if (session && (counts[item._id] ?? 0) > 0) logEvent(item._id, "sub", -1);
    }

    function reset(item) {
        const current = counts[item._id] ?? 0;
        if (!session || current === 0) return;
        if (window.confirm(`Reset ${item.name} (${current}) to 0?`)) logEvent(item._id, "reset", -current);
    }

    function undo(event) {
        logEvent(event.itemId, "undo", -event.delta, event._id);
    }

    async function newSession() {
        if (!window.confirm("End this session and start a new one?")) return;
        try {
            const next = await startNewSession();
            setSession(next);
            setEvents([]);
        } catch (err) {
            console.error("[ERROR] Failed to start a new session:", err);
            setError("Could not start a new session.");
        }
    }

    const nameOf = (itemId) => items.find(i => i._id === itemId)?.name ?? "Unknown item";
    const canUndo = (e) => !e.reverses && !undone.has(e._id) && (counts[e.itemId] ?? 0) - e.delta >= 0;
    const recent = [...events].sort((a, b) => b.ts - a.ts).slice(0, 8);

    if (!signedIn) {
        return (
            <>
                <h2 className="title">Quick Log</h2>
                <p>You need to be signed in to log a transaction.</p>
                <p>Please sign in <Link to="/signin">here</Link>.</p>
            </>
        );
    }

    return (
        <>
            <h2 className="title">Quick Log</h2>

            {session && (
                <p>
                    Session: {session.name}{" "}
                    <button className="new_session" onClick={newSession}>New session</button>
                </p>
            )}

            {error && <p className="error">{error}</p>}

            <div className="grid">
                {items.length === 0 ? (
                    <p>No items found.</p>
                ) : (
                    items.map(item => (
                        <div key={item._id} className="card">
                            <h3>{item.name}</h3>
                            <span className="count">{counts[item._id] ?? 0}</span>
                            <div>
                                <button className="sub" onClick={() => sub(item)}>-</button>
                                <button className="reset" onClick={() => reset(item)}>Reset</button>
                                <button className="add" onClick={() => add(item)}>+</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {recent.length !== 0 && (
                <>
                    <h3 className="subtitle">Recent activity</h3>
                    <ul className="activity">
                        {recent.map(e => (
                            <li key={e._id}>
                                <span className="ts">{new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                <span>
                                    {" "}{nameOf(e.itemId)}: {e.action} ({e.delta > 0 ? `+${e.delta}` : e.delta})
                                    <button className="undo" disabled={!canUndo(e)} onClick={() => canUndo(e) && undo(e)}>Undo</button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </>
    );
}