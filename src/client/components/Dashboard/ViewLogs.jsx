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
    const [ sessions, setSessions ] = useState([]);
    const [ items, setItems ] = useState([]);
    const [ sessionId, setSessionId ] = useState("");
    const [ events, setEvents ] = useState([]);

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

    // sessions and item names come from this device's IndexedDB
    useEffect(() => {
        if (!signedIn) return;
        let cancelled = false;

        (async () => {
            try {
                const [allSessions, cachedItems] = await Promise.all([getAllSessions(), getCachedItems()]);
                if (cancelled) return;

                setSessions(allSessions);
                setItems(cachedItems);
                if (allSessions.length > 0) setSessionId(allSessions[0]._id);
            } catch (err) {
                console.error("[ERROR] Failed to load quick log sessions:", err);
            }
        })();

        return () => { cancelled = true; };
    }, [signedIn]);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;

        getSessionEvents(sessionId)
            .then(data => { if (!cancelled) setEvents(data); })
            .catch(err => console.error("[ERROR] Failed to load session events:", err));

        return () => { cancelled = true; };
    }, [sessionId]);

    const rows = useMemo(() => {
        const counts = getCounts(events);
        return Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([itemId, count]) => ({
                itemId,
                count,
                name: items.find(i => i._id === itemId)?.name ?? "Unknown item",
            }));
    }, [events, items]);

    const total = rows.reduce((sum, r) => sum + r.count, 0);

    const sessionLabel = (s) => {
        const time = new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `${s.name}, ${time}${s.endedAt ? "" : " (active)"}`;
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

            {sessions.length === 0 ? (
                <p>No quick log sessions on this device yet.</p>
            ) : (
                <>
                    <select className="session_select" value={sessionId} onChange={e => setSessionId(e.target.value)}>
                        {sessions.map(s => (
                            <option key={s._id} value={s._id}>{sessionLabel(s)}</option>
                        ))}
                    </select>

                    {rows.length === 0 ? (
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