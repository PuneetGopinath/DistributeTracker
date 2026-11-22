/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/models/quicklog.js
 * License: MIT (see LICENSE)
 */

import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    _id: { // id is made on the phone
        type: String
    },
    loggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    deviceId: {
        type: String,
        required: true
    },
    name: String,
    startedAt: Date,
    endedAt: Date,
});

const eventSchema = new mongoose.Schema({
    _id: { // id from the phone
        type: String
    },
    session: {
        type: String,
        ref: "QuickLogSession",
        required: true,
        index: true
    },
    loggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    deviceId: {
        type: String
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    action: {
        type: String,
        enum: ["add", "sub", "reset", "undo"]
    },
    delta: Number,
    reverses: String,
    ts: Date,
});


export const QuickLogSession = mongoose.model("QuickLogSession", sessionSchema);

export const QuickLogEvent = mongoose.model("QuickLogEvent", eventSchema);