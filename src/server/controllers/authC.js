/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/controllers/authC.js
 * License: MIT (see LICENSE)
 */

import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import User from "../models/user.js";

import Item from "../models/item.js";

const getToken = async (id) => {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    let userId = id;

    if (typeof userId !== "string") {
        userId = userId.toString();
    }

    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .sign(secret);

    return token;
};

export const signUp = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password are required." });
    }

    const exists = await User.findOne({ $or: [ { username }, { email } ] }).lean();

    if (exists) {
        return res.status(409).json({ message: "An existing account with the provided username/email already exists." });
    }

    const user = await User.create({ username, email, password });

    const token = await getToken(user._id);

    res.cookie("token", token, { httpOnly: true, secure: process.env?.PROD === "1", sameSite: "lax" });


    
    const itemsData = [
        {
            name: "Bhagavad-Gītā As It Is",
            category: "Books",
            price: 350
        },
        {
            name: "Kṛṣṇa",
            category: "Books",
            price: 350
        },
        {
            name: "Rāmāyaṇa",
            category: "Books",
            price: 300
        }
    ].map(item => ({ ...item, createdBy: user._id, createdAt: Date.now() }));

    await Item.insertMany(itemsData);

    

    return res.status(201).json({ message: "User created successfully" });
};

export const signIn = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: "Identifier and password are required." });
    }

    const user = await User.findOne({ $or: [ { username: identifier }, { email: identifier } ] });

    if (!user) {
        return res.status(401).json({ message: "Invalid credentials." });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
        return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = await getToken(user._id);

    res.cookie("token", token, { httpOnly: true, secure: process.env?.PROD === "1", sameSite: "lax" });

    return res.status(200).json({ message: "Signed in successfully", token });
};