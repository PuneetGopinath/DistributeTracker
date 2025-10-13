/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Layout.jsx
 * License: MIT (see LICENSE)
 */

import { Outlet } from "react-router";

export default function Layout() {
    return (
        <>
            <main>
                <Outlet />
            </main>
            <footer className="footer">
                <p>&copy; Puneet Gopinath {new Date().getFullYear()}</p>
                <p>Made with tinge of devotion to Lord Kṛṣṇa</p>
            </footer>
        </>
    );
};