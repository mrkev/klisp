import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Builds the site to the repo-root `docs/` folder, so it can be served on
// GitHub Pages.
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../../docs",
    rollupOptions: {
      input: {
        site: "./index.html",
      },
    },
  },
  // instead of having absolute paths pointing at assets in `index.html`, use
  // relative paths. Works better with github pages where /assets/foobar.js
  // referes to another site
  base: "./",
});
