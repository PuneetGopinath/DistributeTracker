/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/ViewTransactions.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect } from "react";
import axios from "axios";

export default function ViewTransactions() {
    const [ tr, setTr ] = useState(null);

    useEffect(() => {
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
    }, []);

    return (
        <>
            <h2 className="title">Logged Transactions</h2>

            <div className="cards-container">
                {tr ? tr.map((t, index) => (
                    <div key={index} className="card">
                        <h3>Transaction #{index + 1}</h3>
                        <h5>Date: {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString()}</h5>
                        {t.items.map((entry, i) => (
                            <div key={i} className="sub-card">
                                <h3>{entry.quantity}x {entry.item.name}</h3>
                                <p>Price per item: {entry.price}</p>
                                <p>Payment Method: {entry.paymentMethod}</p>
                            </div>
                        ))}
                    </div>
                )) : "No transactions logged so far"}
            </div>
        </>
    );
};