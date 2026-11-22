/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/quicklogR.js
 * License: MIT (see LICENSE)
 */

import { Router } from "express";

import asyncHandler from "../utils/asyncHandler.js";
import { syncQuickLog } from "../controllers/quicklogC.js";

const router = Router();

router.post("/sync", asyncHandler(syncQuickLog));

export default router;