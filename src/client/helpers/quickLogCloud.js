/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/helpers/quickLogCloud.js
 * License: MIT (see LICENSE)
 */

import axios from "axios";

import { getDeviceId } from "./indexedDB";

const config = { withCredentials: true };

// rejections that may go away on their own, so those records are kept and retried
export const RETRY_REASONS = ["could not be saved", "unknown session"];

let fallbackDeviceId = null;

// localStorage can be blocked too, so fall back to an id that lives only as long as the page
export function getCloudDeviceId() {
    try {
        return getDeviceId();
    } catch {
        fallbackDeviceId ??= crypto.randomUUID();
        return fallbackDeviceId;
    }
}

export const createCloudSession = () => ({
    _id: crypto.randomUUID(),
    name: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }),
    startedAt: Date.now(),
    endedAt: null,
});

// the server lists sessions newest first
export async function getCloudActiveSession() {
    const res = await axios.get("/api/quicklog/sessions", config);
    return res.data.find(s => !s.endedAt) ?? null;
}

export async function getCloudCounts(sessionId) {
    const res = await axios.get(`/api/quicklog/sessions/${sessionId}/counts`, config);
    return Object.fromEntries(res.data.counts.map(c => [c.itemId, c.count]));
}

export async function sendToCloud(sessions, events) {
    const res = await axios.post("/api/quicklog/sync", { sessions, events }, config);
    return checkReply(res.data);
}

// a reply that isn't the sync reply (for example an HTML page from a proxy) must count as a failure
export function checkReply(data) {
    if (!Array.isArray(data?.sessions) || !Array.isArray(data?.events) || !Array.isArray(data?.rejected)) {
        throw new Error("Unexpected reply from the server");
    }
    return data;
}

// short text for a failed request, shown on the page so it can be read on a phone
export function describeError(err) {
    if (err?.response) {
        const { status, data } = err.response;
        const message = typeof data?.message === "string" ? data.message : "";
        return `${status}${message ? `: ${message}` : ""}`;
    }
    return [err?.name, err?.message].filter(Boolean).join(": ") || "Unknown error";
}