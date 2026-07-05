import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    // Include the shared package in case it ships class-bearing components.
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Machine Gun brand palette — high-visibility safety orange on ink.
        brand: {
          DEFAULT: "#ff5a1f",
          fg: "#ff7a45",
          ink: "#0b0f14",
          panel: "#12181f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
