/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/EditItem.jsx
 * License: MIT (see LICENSE)
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router";
import axios from "axios";

export default function EditItem({ isSignedIn }) {
    const { itemId } = useParams();
    const [ item, setItem ] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        (async () => {
            try {
                const res = await axios.get(`/api/items/${itemId}`, { signal: controller.signal, withCredentials: true });
            
                if (res.status === 200) {
                    setItem(res.data);
                    console.log("[INFO] Item fetched:", res.data);
                } else {
                    console.error("[ERROR] Failed to fetch item. Status:", res.status);
                    console.error(res);
                }
            } catch (err) {
                console.error("[ERROR] An error occurred while fetching item:", err);
            }
        })();

        return () => controller.abort();
    }, []);

    const edit = async (newItem) => {
        try {
            const res = await axios.post(`/items/edit/${itemId}`, newItem, { withCredentials: true });

            if (res.status === 200) {
                alert("Item edited successfully!");
                console.log("[INFO] Item edited successfully");
            } else {
                console.error("[ERROR] Failed to edit item. Status:", res.status);
                console.error(res);
            }
        } catch (err) {
            console.error("[ERROR] An error occurred while saving edited item:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await edit(item);
    };

    return (
        item ? <>
            <h2>Edit Item</h2>

            <form onSubmit={handleSubmit} className="item-form">
                <label>
                    Name:
                    <input
                        type="text"
                        name="name"
                        value={item.name}
                        onChange={(e) => setItem({ ...item, name: e.target.value })}
                        required
                    />
                </label>
                <br />
                <label>
                    Category:
                    <input
                        type="text"
                        name="category"
                        value={item.category}
                        onChange={(e) => setItem({ ...item, category: e.target.value })}
                        required
                    />
                </label>
                <br />
                <label>
                    Price:
                    <input
                        type="number"
                        name="price"
                        step={0.1}
                        min={0}
                        value={item.price}
                        onChange={(e) => setItem({ ...item, price: parseFloat(e.target.value) })}
                        required
                    />
                </label>
                <br />
                <button type="submit">Save Edits</button>
            </form>
        </>
        : <p>Loading...</p>
    );
};