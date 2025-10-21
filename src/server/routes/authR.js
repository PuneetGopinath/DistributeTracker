/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/routes/authR.js
 * License: MIT (see LICENSE)
 */

import { Router } from "express";

import asyncHandler from "../utils/asyncHandler.js";
import { signUp, signIn } from "../controllers/authC.js";

const router = Router();

router.post("/signup", asyncHandler(signUp));
router.post("/signin", asyncHandler(signIn));

export default router;