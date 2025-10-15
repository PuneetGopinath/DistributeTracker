/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/App.jsx
 * License: MIT (see LICENSE)
 */

import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import Home from "./components/Home";
import LogTransaction from "./components/Dashboard/LogTransaction";
import ViewTransactions from "./components/Dashboard/ViewTransactions";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="dashboard/log-transaction" element={<LogTransaction />} />
                    <Route path="dashboard/view-transactions" element={<ViewTransactions />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};