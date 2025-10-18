/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/ListItems.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect } from "react";
import axios from "axios";

export default function ListItems() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const res = await axios.get("/api/items", { signal: controller.signal });

                if (res.status === 200) {
                    setItems(res.data);
                    console.log("[INFO] Items fetched:", res.data);
                } else {
                    console.error("[ERROR] Failed to fetch items. Status:", res.status);
                    console.error(res);
                }
            } catch (err) {
                console.error("[ERROR] An error occurred while fetching items:", err);
            }
        })();
    }, []);

    return (
        <>
            <h2 className="title">List of Items</h2>
            <br />
            {items.length === 0 ? (
                <p>No items found.</p>
            ) : (
                <ul>
                    {items.map(item => (
                        <li key={item._id}>{item.name} - {item.category} <button disabled>Edit</button></li>
                    ))}
                </ul>
            )}
        </>
    );
};