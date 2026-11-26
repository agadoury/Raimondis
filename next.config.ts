import { existsSync, readdirSync } from "node:fs";
import type { NextConfig } from "next";

// Optional photos: any image in public/photos named after a colleague's id
// (e.g. alex-gadoury.jpg) replaces that person's initials. The list of files is
// read once, when the site is built.
const photos = existsSync("public/photos")
  ? readdirSync("public/photos").filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
  : [];

const nextConfig: NextConfig = {
  agentRules: false,
  env: { PHOTO_FILES: JSON.stringify(photos) },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
