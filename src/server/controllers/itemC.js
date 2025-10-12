/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/controllers/itemC.js
 * License: MIT (see LICENSE)
 */

import Item from "../models/item";

export const getItems = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const items = await Item.find({ createdBy: userId }).lean();
    res.json(items);
};

export const createItem = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const createdBy = req.user.id;
    const { name, category } = req.body;

    if (!name || !category) {
        return res.status(400).json({ message: "Name and category are required" });
    }

    const newItem = await Item.create({
        name,
        category,
        createdBy
    });

    res.json({ message: "Item created successfully", item: newItem._doc });
};