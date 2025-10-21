/**
 * DistributeTracker
 * © 2025 Puneet Gopinath. All rights reserved.
 * Filename: src/client/components/SignUp.jsx
 * License: MIT (see LICENSE)
 */

import { useNavigate } from "react-router";
import axios from "axios";

export default function SignUp({ signedIn, setSigned }) {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        (async () => {
            try {
                const res = await axios.post("/api/auth/signup", data);

                if (res.status === 201) {
                    console.log("[INFO] User signed up successfully:", res.data);
                    localStorage.setItem("signedin", "true");
                    alert("Successfully Signed Up!");
                    setSigned(true);
                    navigate("/");
                } else {
                    console.error("[ERROR] Failed to sign up. Status:", res.status);
                    console.error(res);
                    alert(`Error: ${res.data?.message || "Unknown error occurred."}. Please try again.`);
                }
            } catch (err) {
                console.error("[ERROR] While signing up", err.message);
                console.error(err);
                console.error(err.response.data);
                alert(`Error: ${err.response?.data?.message || err.message}. Please try again.`);
            }
        })();
    };

    return (
        <>
            <h2 className="title">Sign Up</h2>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Username:
                    <input type="text" name="username" required />
                </label>
                <label>
                    Email:
                    <input type="email" name="email" required />
                </label>
                <label>
                    Password:
                    <input type="password" name="password" required />
                </label>
                <button type="submit">Sign Up</button>
            </form>
        </>
    );
};