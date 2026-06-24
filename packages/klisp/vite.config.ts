import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// Builds the klisp library
// https://vitejs.dev/config/
export default defineConfig({
  logLevel: "info",
  plugins: [dts()],
  server: {
    port: 5174,
  },
  build: {
    outDir: "dist",
    minify: false,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "klisp",
      // the proper extensions will be added
      fileName: "klisp",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled into your library
      external: ["parsimmon"],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          parsimmon: "Parsimmon",
        },
      },
    },
  },
});
