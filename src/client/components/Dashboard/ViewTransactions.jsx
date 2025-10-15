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
                const res = await axios.get("/api/transactions", { signal: controller.signal });

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
            <h2>Logged Transactions</h2>

            <div class="cards-container">
                {tr ? tr.map((t, i) => (
                    <div key={i} class="card">
                        <h2>{t.quantity}x {t.item.name}</h2>

                        <h5>Price per item: {t.price}</h5>
                        <h5>Payment Method: {t.paymentMethod}</h5>
                    </div>
                )) : "No transactions logged so far"}
            </div>
        </>
    );
};