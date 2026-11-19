/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/config/db.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

import dns from "node:dns";

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("[INFO] Connected to MongoDB");
        return true;
    } catch (err) {
        console.error("[ERROR] MongoDB connection error:", err.message);
        console.error(err);
        process.exit(1);
    }
};

export default connectToDB;