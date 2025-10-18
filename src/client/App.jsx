/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/App.jsx
 * License: MIT (see LICENSE)
 */

import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import Home from "./components/Home";
import CreateItem from "./components/Dashboard/CreateItem";
import LogTransaction from "./components/Dashboard/LogTransaction";
import ViewTransactions from "./components/Dashboard/ViewTransactions";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="dashboard">
                        <Route path="create-item" element={<CreateItem />} />
                        <Route path="log-transaction" element={<LogTransaction />} />
                        <Route path="view-transactions" element={<ViewTransactions />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};