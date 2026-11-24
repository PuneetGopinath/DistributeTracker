/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/QuickLog.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router";

import axios from "axios";

import {
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
import {
    RETRY_REASONS,
    describeError,
    getCloudDeviceId,
    createCloudSession,
    getCloudActiveSession,
    getCloudCounts,
    sendToCloud,
} from "../../helpers/quickLogCloud";

export default function QuickLog({ signedIn }) {
    const [items, setItems] = useState([]);
    const [session, setSession] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");

    // "checking" until we know whether IndexedDB works, then "local" or "cloud"
    const [storage, setStorage] = useState("checking");
    const [baseCounts, setBaseCounts] = useState({});

    const [pending, setPending] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [syncFailed, setSyncFailed] = useState(false);
    const [syncDetail, setSyncDetail] = useState("");
    const [online, setOnline] = useState(navigator.onLine);

    // cloud mode only: what has not reached the server yet, held in memory
    const queueRef = useRef([]);
    const unsentSessionsRef = useRef([]);
    const flushingRef = useRef(false);

    const counts = useMemo(() => {
        const merged = { ...baseCounts };
        Object.entries(getCounts(events)).forEach(([itemId, n]) => {
            merged[itemId] = (merged[itemId] ?? 0) + n;
        });
        return merged;
    }, [baseCounts, events]);
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
            setSyncDetail("");
        } catch (err) {
            console.error("[ERROR] Quick log sync failed:", err);
            setSyncFailed(true);
            setSyncDetail(describeError(err));
        } finally {
            setSyncing(false);
            refreshPending();
        }
    }, [refreshPending]);

    // cloud mode: send whatever is waiting in memory
    const flushCloud = useCallback(async () => {
        if (flushingRef.current || !navigator.onLine) return;
        if (queueRef.current.length === 0 && unsentSessionsRef.current.length === 0) {
            setSyncFailed(false);
            setSyncDetail("");
            return;
        }

        flushingRef.current = true;
        setSyncing(true);

        try {
            while (queueRef.current.length > 0 || unsentSessionsRef.current.length > 0) {
                const data = await sendToCloud(unsentSessionsRef.current.slice(0, 50), queueRef.current.slice(0, 200));

                // ids are UUIDs, so events and sessions can share one set
                const finished = new Set([
                    ...data.events,
                    ...data.sessions,
                    ...data.rejected.filter(r => r.id && !RETRY_REASONS.includes(r.reason)).map(r => r.id),
                ]);

                const before = queueRef.current.length + unsentSessionsRef.current.length;
                queueRef.current = queueRef.current.filter(e => !finished.has(e._id));
                unsentSessionsRef.current = unsentSessionsRef.current.filter(s => !finished.has(s._id));

                // nothing was accepted, so stop and let the next trigger try again
                if (queueRef.current.length + unsentSessionsRef.current.length === before) break;
            }
            setSyncFailed(false);
            setSyncDetail("");
        } catch (err) {
            console.error("[ERROR] Sending to the cloud failed:", err);
            setSyncFailed(true);
            setSyncDetail(describeError(err));
        } finally {
            flushingRef.current = false;
            setSyncing(false);
            setPending(queueRef.current.length);
        }
    }, []);

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
                setStorage("local");
            } catch (err) {
                console.error("[ERROR] Failed to load local data, sending taps straight to the cloud:", err);
                if (!cancelled) setStorage("cloud");
            }
        })();

        return () => { cancelled = true; };
    }, [signedIn]);

    // cloud mode: pick up the open session from the server, or start a new one
    useEffect(() => {
        if (!signedIn || storage !== "cloud") return;
        let cancelled = false;

        (async () => {
            let active = null;
            let base = {};

            try {
                active = await getCloudActiveSession();
                if (active) base = await getCloudCounts(active._id);
            } catch (err) {
                console.error("[ERROR] Could not load the open session from the cloud:", err);
            }
            if (cancelled) return;

            if (!active) {
                active = createCloudSession();
                unsentSessionsRef.current.push(active);
            }

            setSession(active);
            setBaseCounts(base);
            setEvents([]);
            flushCloud();
        })();

        return () => { cancelled = true; };
    }, [signedIn, storage, flushCloud]);

    // then try to refresh the item list from the server
    useEffect(() => {
        if (!signedIn) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/items", { signal: controller.signal, withCredentials: true });
                setItems(res.data);
                cacheItems(res.data).catch(err => console.warn("[WARN] Could not save the item list on this device:", err));
            } catch (err) {
                if (!axios.isCancel(err)) console.error("[ERROR] Could not fetch items, using the saved list:", err);
            }
        })();

        return () => controller.abort();
    }, [signedIn]);

    // local mode: sync when the page opens, when the connection comes back, and every 30 seconds
    useEffect(() => {
        if (!signedIn || storage !== "local") return;

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
    }, [signedIn, storage, runSync, refreshPending]);

    // local mode: and shortly after the last tap
    useEffect(() => {
        if (!signedIn || storage !== "local" || events.length === 0) return;

        const timer = setTimeout(runSync, 2000);
        return () => clearTimeout(timer);
    }, [events, signedIn, storage, runSync]);

    // cloud mode: retry when the connection comes back and every 10 seconds
    useEffect(() => {
        if (!signedIn || storage !== "cloud") return;

        const goOnline = () => {
            setOnline(true);
            flushCloud();
        };
        const goOffline = () => setOnline(false);

        window.addEventListener("online", goOnline);
        window.addEventListener("offline", goOffline);
        const timer = setInterval(flushCloud, 10000);

        return () => {
            window.removeEventListener("online", goOnline);
            window.removeEventListener("offline", goOffline);
            clearInterval(timer);
        };
    }, [signedIn, storage, flushCloud]);

    // cloud mode: unsent taps only exist in memory, so warn before the page closes
    useEffect(() => {
        if (storage !== "cloud" || pending === 0) return;

        const warn = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [storage, pending]);

    async function logEvent(itemId, action, delta, reverses) {
        const event = {
            _id: crypto.randomUUID(),
            sessionId: session._id,
            deviceId: getCloudDeviceId(),
            itemId,
            action,
            delta,
            ts: Date.now(),
            synced: 0,
            ...(reverses && { reverses }),
        };

        if (storage === "cloud") {
            queueRef.current.push(event);
            setEvents(prev => [...prev, event]);
            setPending(queueRef.current.length);
            setError("");
            flushCloud();
            return;
        }

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

        if (storage === "cloud") {
            const next = createCloudSession();
            unsentSessionsRef.current = [
                ...unsentSessionsRef.current.filter(s => s._id !== session._id),
                { ...session, endedAt: Date.now() },
                next,
            ];

            setSession(next);
            setBaseCounts({});
            setEvents([]);
            flushCloud();
            return;
        }

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

            {syncFailed && syncDetail && <p className="error">Last sync error: {syncDetail}</p>}

            {storage === "cloud" && (
                <p className="error">
                    Storage is not available on this device, so taps are sent straight to the cloud.
                    Keep this page open until the status says all synced.
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