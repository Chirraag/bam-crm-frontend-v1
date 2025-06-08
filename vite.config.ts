import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "*",
      "3800d326-73fa-405a-8073-1a012b818f52-00-3o578j2y74zuj.sisko.replit.dev",
    ],
    host: "0.0.0.0", // Listen on all network interfaces
  },
  optimizeDeps: {
    include: ["react-is"],
  },
});
