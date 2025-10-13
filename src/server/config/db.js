/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/config/db.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

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