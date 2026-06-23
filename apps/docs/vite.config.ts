import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@mosaic/core": new URL(
        "../../packages/core/src/index.ts",
        import.meta.url,
      ).pathname,
      "@mosaic/react": new URL(
        "../../packages/react/src/index.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
