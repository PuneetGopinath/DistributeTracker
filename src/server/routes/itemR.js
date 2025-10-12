/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/itemR.js
 * License: MIT (see LICENSE)
 */

import express from "express";

import asyncHandler from "../utils/asyncHandler";
import { getItems, createItem } from "../controllers/itemC";

const router = express.Router();

router.get("/", asyncHandler(getItems));
router.post("/", asyncHandler(createItem));

export default router;