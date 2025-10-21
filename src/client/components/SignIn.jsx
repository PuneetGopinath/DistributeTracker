/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/SignIn.jsx
 * License: MIT (see LICENSE)
 */

import { useNavigate } from "react-router";
import axios from "axios";

export default function SignIn({ signedIn, setSigned }) {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        (async () => {
            try {
                const res = await axios.post("/api/auth/signin", data);

                if (res.status === 200) {
                    console.log("[INFO] User signed in successfully:", res.data);
                    localStorage.setItem("signedin", "true");
                    alert("Successfully Signed In!");
                    setSigned(true);
                    navigate("/");
                } else {
                    console.error("[ERROR] Failed to sign in. Status:", res.status);
                    console.error(res);
                    alert(`Error: ${res.data?.message || "Unknown error occurred."}. Please try again.`);
                }
            } catch (err) {
                console.error("[ERROR] While signing in", err.message);
                console.error(err);
                console.error(err.response.data);
                alert(`Error: ${err.response?.data?.message || err.message}. Please try again.`);
            }
        })();
    };

    return (
        <>
            <h2 className="title">Sign In</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Username or Email:
                    <input type="text" name="identifier" required />
                </label>
                <label>
                    Password:
                    <input type="password" name="password" required />
                </label>
                <button type="submit">Sign In</button>
            </form>
        </>
    );
};