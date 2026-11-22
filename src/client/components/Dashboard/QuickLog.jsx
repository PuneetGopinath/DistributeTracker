/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/QuickLog.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";

import axios from "axios";

import {
    getDeviceId,
    getActiveSession,
    startNewSession,
    getSessionEvents,
    addEvent,
    getCachedItems,
    cacheItems,
    getCounts,
    countUnsyncedEvents,
} from "../../helpers/indexedDB";
import { syncQuickLog } from "../../helpers/quickLogSync";

export default function QuickLog({ signedIn }) {
    const [items, setItems] = useState([]);
    const [session, setSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");

    const [pending, setPending] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncFailed, setSyncFailed] = useState(false);
    const [online, setOnline] = useState(navigator.onLine);

    const counts = useMemo(() => getCounts(events), [events]);
    const undone = useMemo(() => new Set(events.filter(e => e.reverses).map(e => e.reverses)), [events]);

    const refreshPending = useCallback(() => {
        countUnsyncedEvents()
            .then(setPending)
            .catch(err => console.error("[ERROR] Failed to count pending events:", err));
    }, []);

    const runSync = useCallback(async () => {
        if (!navigator.onLine) return;

        setSyncing(true);
        try {
            await syncQuickLog();
            setSyncFailed(false);
        } catch (err) {
            console.error("[ERROR] Quick log sync failed:", err);
            setSyncFailed(true);
        } finally {
            setSyncing(false);
            refreshPending();
        }
    }, [refreshPending]);

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

    // sync when the page opens, when the connection comes back, and every 30 seconds
    useEffect(() => {
        if (!signedIn) return;

        const goOnline = () => {
            setOnline(true);
            runSync();
        };
        const goOffline = () => setOnline(false);

        refreshPending();
        runSync();

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        const timer = setInterval(runSync, 30000);

        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
            clearInterval(timer);
        };
    }, [signedIn, runSync, refreshPending]);

    // and shortly after the last tap
    useEffect(() => {
        if (!signedIn || events.length === 0) return;

        const timer = setTimeout(runSync, 2000);
        return () => clearTimeout(timer);
    }, [events, signedIn, runSync]);

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
            setPending(prev => prev + 1);
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
            runSync();
        } catch (err) {
            console.error("[ERROR] Failed to start a new session:", err);
            setError("Could not start a new session.");
        }
    }

    const nameOf = (itemId) => items.find(i => i._id === itemId)?.name ?? "Unknown item";
    const canUndo = (e) => !e.reverses && !undone.has(e._id) && (counts[e.itemId] ?? 0) - e.delta >= 0;
    const recent = [...events].sort((a, b) => b.ts - a.ts).slice(0, 8);

    let syncLabel = "✓ All synced";
    if (syncing) syncLabel = "⟳ Syncing…";
    else if (!online) syncLabel = pending > 0 ? `Offline, ${pending} pending` : "Offline";
    else if (syncFailed) syncLabel = `⚠ Sync failed, will retry${pending > 0 ? ` (${pending} pending)` : ""}`;
    else if (pending > 0) syncLabel = `● ${pending} pending`;

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
                    <span className="session_name">Session: {session.name}{" "}</span>
                    <button className="new_session" onClick={newSession}>New session</button>
                </p>
            )}

            <span className="sync_status">{syncLabel}</span>

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