/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/QuickLog.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect } from "react";
import { Link } from "react-router";

import axios from "axios";

function setCount(itemId, setItems, count = undefined) {
    if (count && count < 0) count = 0;
    setItems(prevItems => {
        return prevItems.map(item => {
            if (item._id === itemId) {
                if (count === undefined) count = (item?.count ?? 0) + 1;
                return { ...item, count };
            }
            return item;
        });
    });
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

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/items", { signal: controller.signal, withCredentials: true });

                if (res.status === 200) {
                    setItems(res.data.map(item => ({ ...item, count: 0 })));
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
                                <button className="sub" onClick={() => setCount(item._id, setItems, (item?.count ?? 1) - 1)}>-</button>
                                <button className="reset" onClick={() => setCount(item._id, setItems, 0)}>Reset</button>
                                <button className="add" onClick={() => setCount(item._id, setItems)}>+</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}