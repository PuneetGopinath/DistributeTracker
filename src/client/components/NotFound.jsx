/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/NotFound.jsx
 * License: MIT (see LICENSE)
 */

import { Link } from "react-router";

export default function NotFound() {
    return (
        <>
            <h1 className="title">Error 404</h1>
            <h5>The page you are looking for does not exist.</h5>
            <h5>Please check if the entered URL is correct.</h5>
            <br />
            <h5>If you believe this is a mistake, please contact support.</h5>
            <h5>Return to <Link to="/">Distribute Tracker</Link>.</h5>
        </>
    );
};