/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/transactionR.js
 * License: MIT (see LICENSE)
 */

import { Router } from "express";

import asyncHandler from "../utils/asyncHandler";
import { createTransaction, getTransaction } from "../controllers/transactionC";

const router = Router();

router.post("/", asyncHandler(createTransaction));
router.get("/:id", asyncHandler(getTransaction));

export default router;