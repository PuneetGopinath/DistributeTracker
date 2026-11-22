/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/quicklogR.js
 * License: MIT (see LICENSE)
 */

import { Router } from "express";

import asyncHandler from "../utils/asyncHandler.js";
import { syncQuickLog, getQuickLogSessions, getQuickLogSessionCounts } from "../controllers/quicklogC.js";

const router = Router();

router.post("/sync", asyncHandler(syncQuickLog));
router.get("/sessions", asyncHandler(getQuickLogSessions));
router.get("/sessions/:id/counts", asyncHandler(getQuickLogSessionCounts));

export default router;