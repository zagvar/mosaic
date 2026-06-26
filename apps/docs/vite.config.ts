import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@zagvar/mosaic-core": new URL(
        "../../packages/core/src/index.ts",
        import.meta.url,
      ).pathname,
      "@zagvar/mosaic-react": new URL(
        "../../packages/react/src/index.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
