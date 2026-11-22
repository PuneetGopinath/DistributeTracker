/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/controllers/quicklogC.js
 * License: MIT (see LICENSE)
 */

import { QuickLogSession, QuickLogEvent } from "../models/quicklog.js";
import Item from "../models/item.js";

const unauthorizedMsg = "You are not authorized. Please sign in/sign up to continue.";

const MAX_SESSIONS = 50;
const MAX_EVENTS = 500;
const ACTIONS = ["add", "sub", "reset", "undo"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID = /^[0-9a-f]{24}$/i;

const isUUID = (value) => typeof value === "string" && UUID.test(value);

const toDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

function cleanSession(raw) {
    if (!isUUID(raw?._id)) return { error: "invalid _id" };

    const startedAt = toDate(raw.startedAt);
    if (!startedAt) return { error: "invalid startedAt" };

    const endedAt = raw.endedAt == null ? null : toDate(raw.endedAt);
    if (raw.endedAt != null && !endedAt) return { error: "invalid endedAt" };

    const name = typeof raw.name === "string" ? raw.name.slice(0, 60) : "";

    return { value: { _id: raw._id, name, startedAt, endedAt } };
}

function cleanEvent(raw) {
    if (!isUUID(raw?._id)) return { error: "invalid _id" };
    if (!isUUID(raw.sessionId)) return { error: "invalid sessionId" };
    if (typeof raw.deviceId !== "string" || raw.deviceId.length === 0 || raw.deviceId.length > 100) return { error: "invalid deviceId" };
    if (typeof raw.itemId !== "string" || !OBJECT_ID.test(raw.itemId)) return { error: "invalid itemId" };
    if (!ACTIONS.includes(raw.action)) return { error: "invalid action" };
    if (!Number.isInteger(raw.delta) || Math.abs(raw.delta) > 100000) return { error: "invalid delta" };
    if (raw.reverses != null && !isUUID(raw.reverses)) return { error: "invalid reverses" };

    const ts = toDate(raw.ts);
    if (!ts) return { error: "invalid ts" };

    return {
        value: {
            _id: raw._id,
            session: raw.sessionId,
            item: raw.itemId,
            deviceId: raw.deviceId,
            action: raw.action,
            delta: raw.delta,
            ts,
            ...(raw.reverses && { reverses: raw.reverses }),
        },
    };
}

// Runs the bulk write and returns a Map of failed op index -> message.
// ordered: false so one bad document doesn't stop the rest.
async function runBulk(Model, ops) {
    const failed = new Map();
    if (ops.length === 0) return failed;

    try {
        await Model.bulkWrite(ops, { ordered: false });
    } catch (err) {
        if (!err.writeErrors) throw err;
        [].concat(err.writeErrors).forEach(we => failed.set(we.index, we.errmsg || "write failed"));
    }

    return failed;
}

// POST body: { sessions: [...], events: [...] }
// Replies with the ids that are safely stored, so the client can mark exactly those as synced.
export const syncQuickLog = async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: unauthorizedMsg });
    }

    try {
        const loggedBy = req.user.id;
        const { sessions, events } = req.body ?? {};

        if (!Array.isArray(sessions) || !Array.isArray(events)) {
            return res.status(400).json({ message: "sessions and events must be arrays." });
        }
        if (sessions.length > MAX_SESSIONS || events.length > MAX_EVENTS) {
            return res.status(413).json({ message: "Too many records in one request." });
        }

        const rejected = [];

        // sessions first, because events point at them
        const sessionOps = [];
        const sessionIds = [];

        sessions.forEach(raw => {
            const { value, error } = cleanSession(raw);
            if (error) return rejected.push({ type: "session", id: raw?._id ?? null, reason: error });

            sessionIds.push(value._id);
            sessionOps.push({
                updateOne: {
                    filter: { _id: value._id, loggedBy },
                    update: { $set: { name: value.name, startedAt: value.startedAt, endedAt: value.endedAt } },
                    upsert: true,
                },
            });
        });

        const failedSessions = await runBulk(QuickLogSession, sessionOps);
        const syncedSessions = new Set();

        sessionIds.forEach((id, i) => {
            if (failedSessions.has(i)) rejected.push({ type: "session", id, reason: "could not be saved" });
            else syncedSessions.add(id);
        });

        // events: insert only, an existing event is never changed, so retries are harmless
        const cleanEvents = [];

        events.forEach(raw => {
            const { value, error } = cleanEvent(raw);
            if (error) return rejected.push({ type: "event", id: raw?._id ?? null, reason: error });
            cleanEvents.push(value);
        });

        // the session of every event must belong to this user
        const missing = [...new Set(cleanEvents.map(e => e.session))].filter(id => !syncedSessions.has(id));
        const owned = missing.length > 0
            ? await QuickLogSession.distinct("_id", { _id: { $in: missing }, loggedBy })
            : [];
        const knownSessions = new Set([...syncedSessions, ...owned]);

        // and the item has to exist
        const itemIds = [...new Set(cleanEvents.map(e => e.item))];
        const foundItems = await Item.distinct("_id", { _id: { $in: itemIds } });
        const knownItems = new Set(foundItems.map(String));

        const eventOps = [];
        const eventIds = [];

        cleanEvents.forEach(e => {
            if (!knownSessions.has(e.session)) {
                return rejected.push({ type: "event", id: e._id, reason: "unknown session" });
            }
            if (!knownItems.has(e.item)) {
                return rejected.push({ type: "event", id: e._id, reason: "unknown item" });
            }

            const { _id, ...fields } = e;
            eventIds.push(_id);
            eventOps.push({
                updateOne: {
                    filter: { _id, loggedBy },
                    update: { $setOnInsert: fields },
                    upsert: true,
                },
            });
        });

        const failedEvents = await runBulk(QuickLogEvent, eventOps);
        const syncedEvents = [];

        eventIds.forEach((id, i) => {
            if (failedEvents.has(i)) rejected.push({ type: "event", id, reason: "could not be saved" });
            else syncedEvents.push(id);
        });

        res.status(200).json({
            sessions: [...syncedSessions],
            events: syncedEvents,
            rejected,
        });
    } catch (err) {
        console.error("[ERROR] Quick log sync failed:", err);
        res.status(500).json({ message: "Sync failed, please try again." });
    }
};