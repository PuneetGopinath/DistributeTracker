/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/server/utils/asyncHandler.js
 * License: MIT (see LICENSE)
 */

const asyncHandler = (fn) => (res, req, next) => Promise.resolve(fn(res, req, next)).catch(next);

export default asyncHandler;