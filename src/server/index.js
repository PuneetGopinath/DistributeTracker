/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/index.js
 * License: MIT (see LICENSE)
 */

import { config } from "dotenv";

import express from "express";
import path from "path";

config();

const app = express();
const PORT = process.env.PORT ?? 3500;

app.use(express.json());

app.use((err, req, res, next) => {
    console.error("[ERROR] Express Error Handler:", err.message);
    console.error(err);
    res.status(500).json({ error: err?.message ?? "Internal Server Error" });
});

app.listen(PORT, () => {
    console.log(`[INFO] DistributeTracker server running on port ${PORT}`);
});