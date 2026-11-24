/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/helpers/quickLogSync.js
 * License: MIT (see LICENSE)
 */

import axios from "axios";

import { checkReply } from "./quickLogCloud";

import {
    getUnsyncedEvents,
    getUnsyncedSessions,
    setEventsSyncStatus,
    markSessionsSynced,
} from "./indexedDB";

const BATCH_SIZE = 200;
const MAX_SESSIONS = 50;

// rejections that may go away on their own, so those events stay unsynced and are retried
const RETRY_REASONS = ["could not be saved", "unknown session"];

let inFlight = null;

// sends one batch, returns how many events the server gave a final answer for
async function pushBatch() {
    const [events, allSessions] = await Promise.all([getUnsyncedEvents(BATCH_SIZE), getUnsyncedSessions()]);
    const sessions = allSessions.slice(0, MAX_SESSIONS);

    if (events.length === 0 && sessions.length === 0) return 0;

    const res = await axios.post("/api/quicklog/sync", { sessions, events }, { withCredentials: true });
    const { sessions: storedSessions, events: storedEvents, rejected } = checkReply(res.data);

    await markSessionsSynced(sessions.filter(s => storedSessions.includes(s._id)));
    await setEventsSyncStatus(storedEvents, 1);

    const dead = rejected
        .filter(r => r.type === "event" && r.id && !RETRY_REASONS.includes(r.reason))
        .map(r => r.id);
    await setEventsSyncStatus(dead, 2);

    if (rejected.length > 0) console.warn("[WARN] Server rejected some quick log records:", rejected);

    return events.length === BATCH_SIZE ? storedEvents.length + dead.length : 0;
}

async function doSync() {
    let progress;
    do {
        progress = await pushBatch();
    } while (progress > 0);
}

// If a sync is already running, callers share it instead of starting a second one.
export function syncQuickLog() {
    if (!inFlight) inFlight = doSync().finally(() => { inFlight = null; });
    return inFlight;
}