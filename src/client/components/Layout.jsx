/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/Layout.jsx
 * License: MIT (see LICENSE)
 */

import { Link, Outlet } from "react-router";

export default function Layout({ signedIn }) {
    return (
        <>
            <header className="header">
                <div className="header-left">
                    <Link to="/" className="nav-link">DistributeTracker</Link>
                </div>
                <div className="header-right">
                    {signedIn
                        ? <>
                            <Link to="/dashboard/items" className="nav-link">List Items</Link>
                            <Link to="/dashboard/items/create" className="nav-link">Create Item</Link>
                            <Link to="/dashboard/transactions/log" className="nav-link">Log Transaction</Link>
                            <Link to="/dashboard/transactions" className="nav-link">View Transactions</Link>
                        </>
                        : <>
                            <Link to="/signin" className="nav-link">Sign In</Link>
                            <Link to="/signup" className="nav-link">Sign Up</Link>
                        </>
                    }
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