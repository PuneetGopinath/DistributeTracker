/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/itemR.js
 * License: MIT (see LICENSE)
 */

import { Router } from "express";

import asyncHandler from "../utils/asyncHandler.js";
import { getItem, getItems, createItem } from "../controllers/itemC.js";

const router = Router();

router.get("/:id", asyncHandler(getItem));
router.get("/", asyncHandler(getItems));
router.post("/", asyncHandler(createItem));

export default router;