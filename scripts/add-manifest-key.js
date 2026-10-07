#!/usr/bin/env node
/**
 * add-manifest-key.js - Adds the extension public key to build/manifest.json
 *
 * The key keeps the extension ID fixed, which the VPN native host relies on.
 * It is read from EXTENSION_PUBLIC_KEY in .env. Runs after `npm run build`.
 *
 * Usage: node scripts/add-manifest-key.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
require("dotenv").config({ path: path.join(ROOT, ".env"), quiet: true });

const manifestPath = path.join(ROOT, "build", "manifest.json");
const key = (process.env.EXTENSION_PUBLIC_KEY || "").trim();

if (!key) {
  console.warn(
    "[manifest] EXTENSION_PUBLIC_KEY is not set, build/manifest.json has no key and the extension ID will differ"
  );
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
fs.writeFileSync(manifestPath, JSON.stringify({ key, ...manifest }, null, 2) + "\n");
console.log("[manifest] key added to build/manifest.json");
