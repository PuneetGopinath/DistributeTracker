/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/index.js
 * License: MIT (see LICENSE)
 */

import { config } from "dotenv";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import connectToDB from "./config/db.js";

import authRouter from "./routes/authR.js";
import itemRouter from "./routes/itemR.js";
import transactionRouter from "./routes/transactionR.js";

config();

const app = express();
const PORT = process.env.PORT ?? 3500;
const prod = process.env?.PROD && process.env.PROD === "1";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env?.JWT_SECRET) {
    console.error("[FATAL] JWT_SECRET environment variable not set. Exiting...");
    process.exit(1);
}

app.use(express.json());
app.use((req, res, next) => {
    if (!process.env?.DEMO_USER_ID)
        return res.status(500).json({ message: "Environment variables not set" });
    const userId = process.env.DEMO_USER_ID;
    req.user = { id: userId };
    next();
});

app.get("/livez", (req, res) => res.status(200).send({ status: "OK", timestamp: Date.now() }));

app.use("/api/auth", authRouter);
app.use("/api/items", itemRouter);
app.use("/api/transactions", transactionRouter);

if (prod) {
    app.use(express.static(path.join(__dirname, "../client-dist")));

    app.get(/.*/, (req, res) =>
        res.sendFile(path.join(__dirname, "../client-dist/index.html"))
    );
} else {
    app.get("/", (req, res) =>
        res.send(`DistributeTracker running on ${PORT} port and development mode`)
    );
}

app.use((err, req, res, next) => {
    console.error("[ERROR] Express Error Handler:", err.message);
    console.error(err);
    res.status(500).json({ error: err?.message ?? "Internal Server Error" });
});

(async () => {
    await connectToDB();

    app.listen(PORT, () => {
        console.log(`[INFO] DistributeTracker server running on port ${PORT}`);
    });
})();