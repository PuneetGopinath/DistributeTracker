/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/ViewLogs.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";

import axios from "axios";

import { getAllSessions, getSessionEvents, getCachedItems, getCounts } from "../../helpers/indexedDB";

export default function ViewLogs({ signedIn }) {
    const [ tr, setTr ] = useState(null);
    const [ localSessions, setLocalSessions ] = useState([]);
    const [ localLoaded, setLocalLoaded ] = useState(false);
    const [ localFailed, setLocalFailed ] = useState(false);
    const [ cloudSessions, setCloudSessions ] = useState([]);
    const [ cloudFailed, setCloudFailed ] = useState(false);
    const [ cloudAttempt, setCloudAttempt ] = useState(0);
    const [ items, setItems ] = useState([]);
    const [ sessionId, setSessionId ] = useState("");
    const [ rows, setRows ] = useState([]);
    const [ rowsError, setRowsError ] = useState("");

    useEffect(() => {
        if (!signedIn) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/transactions", { signal: controller.signal, withCredentials: true });

                if (res.status === 200) {
                    setTr(res.data);
                    console.log("[INFO] Transactions fetched:", res.data);
                } else {
                    console.error("[ERROR] Failed to fetch transactions. Status:", res.status);
                    console.error(res);
                }
            } catch (err) {
                console.error("[ERROR] Error fetching transactions:", err.message);
                console.error(err);
            }
        })();

        return () => controller.abort();
    }, [signedIn]);

    // sessions saved on this device, and the item names cached by Quick Log
    useEffect(() => {
        if (!signedIn) return;
        let cancelled = false;

        (async () => {
            try {
                const [allSessions, cachedItems] = await Promise.all([getAllSessions(), getCachedItems()]);
                if (cancelled) return;

                setLocalSessions(allSessions);
                setItems(cachedItems);
            } catch (err) {
                // no usable storage on this device, everything comes from the cloud instead
                console.error("[ERROR] Failed to load quick log sessions from this device:", err);
                if (!cancelled) setLocalFailed(true);
            } finally {
                if (!cancelled) setLocalLoaded(true);
            }
        })();

        return () => { cancelled = true; };
    }, [signedIn]);

    // sessions stored in the cloud
    useEffect(() => {
        if (!signedIn) return;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/quicklog/sessions", { signal: controller.signal, withCredentials: true });
                setCloudSessions(res.data);
                setCloudFailed(false);
            } catch (err) {
                if (axios.isCancel(err)) return;
                console.error("[ERROR] Failed to fetch cloud sessions:", err);
                setCloudFailed(true);
            }
        })();

        return () => controller.abort();
    }, [signedIn, cloudAttempt]);

    // try the cloud again when the connection comes back
    useEffect(() => {
        if (!signedIn) return;

        const retry = () => setCloudAttempt(n => n + 1);
        window.addEventListener("online", retry);

        return () => window.removeEventListener("online", retry);
    }, [signedIn]);

    // one list; a session that exists in both places uses the device copy, since it has every tap
    const sessions = useMemo(() => {
        const byId = new Map();
        cloudSessions.forEach(s => byId.set(s._id, { ...s, local: false }));
        localSessions.forEach(s => byId.set(s._id, { ...s, local: true }));

        return [...byId.values()].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    }, [cloudSessions, localSessions]);

    useEffect(() => {
        if (!sessionId && sessions.length > 0) setSessionId(sessions[0]._id);
    }, [sessions, sessionId]);

    const isLocal = sessions.find(s => s._id === sessionId)?.local ?? false;

    // counts: from IndexedDB for device sessions, from the server for the rest
    useEffect(() => {
        if (!sessionId || !localLoaded) return;
        let cancelled = false;
        const controller = new AbortController();

        setRowsError("");

        (async () => {
            try {
                if (isLocal) {
                    const counts = getCounts(await getSessionEvents(sessionId));
                    if (cancelled) return;

                    setRows(Object.entries(counts)
                        .filter(([, count]) => count > 0)
                        .map(([itemId, count]) => ({
                            itemId,
                            count,
                            name: items.find(i => i._id === itemId)?.name ?? "Unknown item",
                        })));
                } else {
                    const res = await axios.get(`/api/quicklog/sessions/${sessionId}/counts`, { signal: controller.signal, withCredentials: true });
                    if (!cancelled) setRows(res.data.counts);
                }
            } catch (err) {
                if (axios.isCancel(err) || cancelled) return;
                console.error("[ERROR] Failed to load session counts:", err);
                setRows([]);
                setRowsError("Could not load this session. Check your connection and try again.");
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [sessionId, isLocal, localLoaded, items, cloudAttempt]);

    const retry = () => setCloudAttempt(n => n + 1);

    const total = rows.reduce((sum, r) => sum + r.count, 0);

    const sessionLabel = (s) => {
        const time = new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const tags = [];
        if (!s.endedAt) tags.push("active");
        if (s.local && !s.synced) tags.push("not synced");

        return `${s.name}, ${time}${tags.length > 0 ? ` (${tags.join(", ")})` : ""}`;
    };

    if (!signedIn) {
        return (
            <>
                <h2 className="title">Logs</h2>
                <p>You need to be signed in to view logs.</p>
                <p>Please sign in <Link to="/signin">here</Link>.</p>
            </>
        );
    }

    return (
        <>
            <h2 className="title">Quick Logs</h2>

            {localFailed && !cloudFailed && (
                <p className="notice">Storage is not available on this device, so only sessions saved in the cloud are shown.</p>
            )}

            {cloudFailed && (
                <p className="error">
                    {localFailed
                        ? "Storage is not available on this device and the cloud could not be reached, so no quick logs can be shown."
                        : "Could not reach the cloud, showing only the sessions saved on this device."}
                    {" "}<button className="retry" onClick={retry}>Retry</button>
                </p>
            )}

            {sessions.length === 0 ? (
                !(localFailed && cloudFailed) && <p>No quick log sessions found yet.</p>
            ) : (
                <>
                    <select className="session_select" value={sessionId} onChange={e => setSessionId(e.target.value)}>
                        {sessions.map(s => (
                            <option key={s._id} value={s._id}>{sessionLabel(s)}</option>
                        ))}
                    </select>

                    {rowsError ? (
                        <p className="error">
                            {rowsError}{" "}<button className="retry" onClick={retry}>Retry</button>
                        </p>
                    ) : rows.length === 0 ? (
                        <p>Nothing was counted in this session.</p>
                    ) : (
                        <>
                            <div className="grid">
                                {rows.map(r => (
                                    <div key={r.itemId} className="card">
                                        <h3>{r.name}</h3>
                                        <span className="count">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                            <p>Total: {total}</p>
                        </>
                    )}
                </>
            )}

            <h2 className="title">Normal Logs</h2>

            <div className="cards-container">
                {tr && tr.length > 0 ? tr.map((t, index) => (
                    <div key={index} className="card">
                        <h3>Log #{index + 1}</h3>
                        <h5>Date: {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString()}</h5>
                        {t.items.map((entry, i) => (
                            <div key={i} className="sub-card">
                                <h3>{entry.quantity}x {entry.item.name}</h3>
                                <p>Price per item: {entry.price}</p>
                                <p>Payment Method: {entry.paymentMethod}</p>
                            </div>
                        ))}
                    </div>
                )) : "No normal logs have been created so far"}
            </div>
        </>
    );
};