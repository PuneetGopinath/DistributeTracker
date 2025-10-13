/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/models/item.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: { // Stores default price for this item. This can be overridden in transactions.
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;