/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/models/user.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

    this.password = await bcrypt.hash(this.password, saltRounds);
});

const User = mongoose.model("User", userSchema);
export default User;