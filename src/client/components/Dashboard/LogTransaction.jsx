/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/LogTransaction.jsx
 * License: MIT (see LICENSE)
 */

import { useState, useEffect } from "react";
import axios from "axios";

export default function LogTransaction() {
    const defaultItem = { itemId: "", quantity: 1, price: 0.00, paymentMethod: "Cash" };

    const [items, setItems] = useState([]);
    const [entries, setEntries] = useState([defaultItem]);

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

        return () => controller.abort(); // Cleanup function on component unmount
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
    };

    return (
        <>
            <h2>Log a new Transaction</h2>

            {items.length === 0
                ? <p>Loading...</p>
                : (<form onSubmit={handleSubmit}>
                    {entries.map((entry, index) => 
                        <div key={index} class="item-entry">
                            <label>
                                Item:
                                <select
                                    name={`itemId-${index}`}
                                    value={entry.itemId}
                                    onChange={({ target }) => {
                                        setEntries(prev => {
                                            const newEntries = [...prev];
                                            newEntries[index].itemId = target.value;
                                            return newEntries;
                                        });
                                    }}
                                    required
                                >
                                    <option value="" disabled selected>Select an item</option>
                                    {items.map(i => (
                                        <option key={i._id} value={i._id}>{i.name} ({i.category})</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Quantity:
                                <input
                                    type="number"
                                    name="quantity"
                                    min={1}
                                    value={entry.quantity}
                                    onChange={({ target }) => {
                                        setEntries(prev => {
                                            const newEntries = [...prev];
                                            newEntries[index].quantity = target.value;
                                            return newEntries;
                                        });
                                    }}
                                    required
                                />
                            </label>
                            <label>
                                Price:
                                <input
                                    type="number"
                                    name="price"
                                    min={0}
                                    step={0.10}
                                    value={entry.price}
                                    onChange={({ target }) => {
                                        setEntries(prev => {
                                            const newEntries = [...prev];
                                            newEntries[index].price = target.value;
                                            return newEntries;
                                        });
                                    }}
                                    required />
                            </label>
                            <label>
                                Payment Method:
                                <input
                                    type="text"
                                    name="paymentMethod"
                                    value={entry.paymentMethod}
                                    onChange={({ target }) => {
                                        setEntries(prev => {
                                            const newEntries = [...prev];
                                            newEntries[index].paymentMethod = target.value;
                                            return newEntries;
                                        });
                                    }}
                                    required
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    if (entries.length > 1) {
                                        setEntries(prev => 
                                            prev.filter((_, i) => index !== i)
                                        )
                                    }
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setEntries(prev => [
                                ...prev,
                                {...defaultItem}
                            ]);
                        }}
                    >
                        Add Item
                    </button>
                    <button type="submit">Log Transaction</button>
                </form>)}
        </>
    );
};