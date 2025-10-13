/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/models/user.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() { return !this.googleId; }
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;