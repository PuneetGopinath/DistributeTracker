/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Layout.jsx
 * License: MIT (see LICENSE)
 */

import { Link, Outlet } from "react-router";

export default function Layout() {
    return (
        <>
            <header className="header">
                <div className="header-left">
                    <Link to="/" className="nav-link">DistributeTracker</Link>
                </div>
                <div className="header-right">
                    <Link to="/dashboard/log-transaction" className="nav-link">Log Transaction</Link>
                    <Link to="/dashboard/view-transactions" className="nav-link">View Transactions</Link>
                </div>
            </header>
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