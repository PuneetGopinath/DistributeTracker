import { BrowserRouter, Routes, Route } from "react-router";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<h1>Root</h1>} />
            </Routes>
        </BrowserRouter>
    );
};