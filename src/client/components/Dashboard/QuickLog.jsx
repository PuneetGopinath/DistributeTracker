/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/QuickLog.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";

import axios from "axios";

const onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("events")) {
        const store = db.createObjectStore("events", { keyPath: "_id" });
        store.createIndex("synced", "synced", { unique: false });
    }
};

const getAllEvents = async () => new Promise((resolve, reject) => {
    const req = indexedDB.open("quicklog", 1);

    req.onupgradeneeded = onupgradeneeded;

    req.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction("events", "readonly");
        const store = tx.objectStore("events");

        const getAll = () => {
            return new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        };

        getAll().then(events => resolve(events)).catch(err => reject(err));
    };

    req.onerror = (event) => {
        console.error("[ERROR] Failed to open IndexedDB:", event.target.error);
        reject(event.target.error);
    };
});

const saveToDB = async (item, action) => {
    const req = indexedDB.open("quicklog", 1);

    req.onupgradeneeded = onupgradeneeded;

    req.onsuccess = async (event) => {
        const db = event.target.result;
        const tx = db.transaction("events", "readwrite");
        const store = tx.objectStore("events");

        store.add({ _id: crypto.randomUUID(), itemId: item._id, action, count: item.count, ts: Date.now(), synced: 0 });
    };

    req.onerror = (event) => {
        console.error("[ERROR] Failed to open IndexedDB:", event.target.error);
    };
};

function loadCount(setItems, events) {
    setItems(prevItems => prevItems.map(item => {
        const itemEvents = events.filter(event => event.itemId === item._id).sort((a, b) => b.ts - a.ts);
        return { ...item, count: itemEvents.length > 0 ? itemEvents[0].count : 0 };
    }));
}

function setCount(itemId, items, setItems, count = undefined, action = "add") {
    if (count && count < 0) count = 0;

    items.forEach(item => {
        if (item._id === itemId) {
            if (count === undefined) count = (item?.count ?? 0) + 1;
            saveToDB({ ...item, count }, action);
        }
    })

    setItems(prevItems => prevItems.map(item => {
            if (item._id === itemId) {
                return { ...item, count };
            }
            return item;
        })
    );
}

export default function QuickLog({ signedIn }) {
    if (!signedIn) {
        return (
            <>
                <h2 className="title">Quick Log</h2>
                <p>You need to be signed in to log a transaction.</p>
                <p>Please sign in <Link to="/signin">here</Link>.</p>
            </>
        );
    }

    const [items, setItems] = useState([]);
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/items", { signal: controller.signal, withCredentials: true });

                if (res.status === 200) {
                    setItems(res.data);
                    loadCount(setItems, events);
                    console.log("[INFO] Items fetched:", res.data);
                } else {
                    console.error("[ERROR] Failed to fetch items. Status:", res.status);
                    console.error(res);
                }
            } catch (err) {
                console.error("[ERROR] An error occurred while fetching items:", err);
            }
        })();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        let cancelled = false;
        getAllEvents().then(events => {
            if (!cancelled) setEvents(events);
        });

        return () => { cancelled = true; };
    }, []);

    return (
        <>
            <h2 className="title">Quick Log</h2>
            <div className="grid">
                {items.length === 0 ? (
                    <p>No items found.</p>
                ) : (
                    items.map(item => (
                        <div key={item._id} className="card">
                            <h3>{item.name}</h3>
                            <span className="count">{item.count}</span>
                            <div>
                                <button className="sub" onClick={() => setCount(item._id, items, setItems, (item?.count ?? 1) - 1, "sub")}>-</button>
                                <button className="reset" onClick={() => setCount(item._id, items, setItems, 0, "reset")}>Reset</button>
                                <button className="add" onClick={() => setCount(item._id, items, setItems)}>+</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}