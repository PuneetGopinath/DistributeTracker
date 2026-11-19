/**
 * DistributeTracker
 * © 2025-26 Puneet Gopinath. All rights reserved.
 * Filename: src/client/App.jsx
 * License: MIT (see LICENSE)
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";

import Layout from "./components/Layout";
import Home from "./components/Home";
import NotFound from "./components/NotFound";

import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";

import CreateItem from "./components/Dashboard/CreateItem";
import ListItems from "./components/Dashboard/ListItems";
import EditItem from "./components/Dashboard/EditItem";
import Log from "./components/Dashboard/Log";
import QuickLog from "./components/Dashboard/QuickLog";
import ViewLogs from "./components/Dashboard/ViewLogs";

export default function App() {
    const [ isSignedIn, setIsSignedIn ] = useState(localStorage?.getItem?.("signedin") === "true");
    console.log("[INFO] User signed in status:", isSignedIn);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout signedIn={isSignedIn} />}>
                    <Route index element={<Home />} />
                    <Route path="signin" element={<SignIn signedIn={isSignedIn} setSigned={setIsSignedIn} />} />
                    <Route path="signup" element={<SignUp signedIn={isSignedIn} setSigned={setIsSignedIn} />} />
                    <Route path="dashboard">
                        <Route path="items">
                            <Route index element={<ListItems signedIn={isSignedIn}/>} />
                            <Route path="create" element={<CreateItem signedIn={isSignedIn} />} />
                            <Route path="edit/:itemId" element={<EditItem signedIn={isSignedIn} />} />
                        </Route>
                        <Route path="transactions">
                            <Route index element={<ViewLogs signedIn={isSignedIn} />} />
                            <Route path="log" element={<Log signedIn={isSignedIn} />} />
                            <Route path="quicklog" element={<QuickLog signedIn={isSignedIn} />} />
                        </Route>
                    </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
};