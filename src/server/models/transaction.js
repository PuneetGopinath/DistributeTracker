/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/models/transaction.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
            validate: {
                validator: Number.isInteger, // Allows only integer values
                message: props => `${props.value} must be an integer`
            }
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            required: true,
            trim: true
        },
    }],
    loggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;