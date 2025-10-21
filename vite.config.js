import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

export default defineConfig({
    root: "./src/client",
    plugins: [react()],
    server: {
        proxy: {
            "/api": {
                target: `http://localhost:${PORT}`,
                configure: (proxy, _options) => {
                    proxy.on("proxyReq", (proxyReq, req, res) => {
                        console.log("Proxying request to target:", proxyReq.path);
                    });
                },
            }, // Proxy API requests to the backend server
            "/livez": {
                target: `http://localhost:${PORT}`,
                configure: (proxy, _options) => {
                    proxy.on("proxyReq", (proxyReq, req, res) => {
                        console.log("Proxying request to target:", proxyReq.path);
                    });
                },
            }, // Proxy health check requests to the backend server
        }
    },
    build: {
        outDir: "../client-dist",
        emptyOutDir: true,
    }
});