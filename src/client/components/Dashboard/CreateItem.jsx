/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Dashboard/CreateItem.jsx
 * License: MIT (see LICENSE)
 */

import axios from "axios";

export default function CreateItem() {
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await axios.post("/api/items", data);
            if (res.status === 201) {
                alert("Item created successfully!");
                console.log("[INFO] Item created successfully");
            }
        } catch (err) {
            console.error("[ERROR] while creating item:", err.message);
            console.error(err);
            console.error(err.response.data);
        }
    };

    return (
        <>
            <h2 className="title">Create a new Item</h2>

            <form onSubmit={handleSubmit} className="item-form">
                <label>
                    Name:
                    <input type="text" name="name" required />
                </label>
                <br />
                <label>
                    Category:
                    <input type="text" name="category" required />
                </label>
                <br />
                <label>
                    Price:
                    <input type="number" name="price" step={0.1} min={0} required />
                </label>
                <br />
                <button type="submit">Create Item</button>
            </form>
        </>
    );
};