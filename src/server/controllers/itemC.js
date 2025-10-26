/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/controllers/itemC.js
 * License: MIT (see LICENSE)
 */

import Item from "../models/item.js";

const unauthorizedMsg = "You are not authorized. Please sign in/sign up to continue."

export const getItems = async (req, res) => {
    // Returns items created by the signed-in user
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    const userId = req.user.id;
    const items = await Item.find({ createdBy: userId }).lean();
    res.json(items);
};

export const createItem = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    const createdBy = req.user.id;
    const { name, category, price } = req.body;

    if (!name || !category || !price) {
        return res.status(400).json({ message: "Name, category, and price are required" });
    }
    
    const newItemData = {
        name,
        category,
        price,
        createdBy
    };

    if (req.body?.createdAt)
        newItemData.createdAt = req.body.createdAt;

    const newItem = await Item.create(newItemData);

    res.status(201).json({ message: "Item created successfully", item: newItem._doc });
};