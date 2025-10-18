/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/controllers/transactionC.js
 * License: MIT (see LICENSE)
 */

import Item from "../models/item.js";
import Transaction from "../models/transaction.js";

const unauthorizedMsg = "You are not authorized. Please sign in/sign up to continue.";

export const createTransaction = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are not attached in the request body. It should be an array of objects."})
    }

    const loggedBy = req.user.id;
    for (const index in items) {
        const i = items[index];
        const item = await Item.findById(i.itemId);
        if (!i.itemId || !item) return res.status(400).json({ message: "Item ID is required for each item and make sure the id is valid." });
        if (!i.quantity || !Number.isInteger(i.quantity) || i.quantity < 1)
            return res.status(400).json({ message: "Quantity is required for each item and it should be a positive integer."});
        
        if (!i.price || isNaN(i.price) || i.price < 0) {
            items[index].price = item.price; // Fallback to item's default price
        }
    }

    const transaction = await Transaction.create({ items, loggedBy });

    return res.status(201).json({ message: "Transaction logged successfully.", transaction: transaction._doc });
};

export const getTransaction = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "Transaction ID is not provided in request parameters."})
    }

    const transaction = await Transaction.findById(id)
        .populate("items.itemId", "name description price")
        .lean();
    res.json(transaction.items);
};

export const getAllTransactions = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    const transactions = await Transaction.find()
        .populate("items.itemId")
        .lean();
    const items = transactions.map(tr => ({ items: tr.items.map(i => ({...i, "item": i.itemId, "itemId": undefined })), createdAt: tr.createdAt }));
    res.json(items);
};