#!/usr/bin/env node
/**
 * watch.js - Development watcher for Qubetics Extension
 *
 * Watches for file changes in src/ and public/ directories,
 * then rebuilds both the webpack bundles and the React app.
 *
 * Usage: node scripts/watch.js
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

let isBuildRunning = false;
let pendingRebuild = false;
let debounceTimer = null;

function log(msg) {
  console.log(`[watch] ${new Date().toLocaleTimeString()} - ${msg}`);
}

function runBuild() {
  if (isBuildRunning) {
    pendingRebuild = true;
    return;
  }
  isBuildRunning = true;
  log("🔨 Starting rebuild...");
  const proc = spawn("npm", ["run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, GENERATE_SOURCEMAP: "false" },
  });

  proc.on("exit", (code) => {
    isBuildRunning = false;
    if (code === 0) {
      log("✅ Build complete! Reload the extension in Chrome.");
    } else {
      log(`❌ Build failed with code ${code}.`);
    }
    if (pendingRebuild) {
      pendingRebuild = false;
      runBuild();
    }
  });
}

function scheduleBuild(filePath) {
  log(`📝 Changed: ${filePath}`);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runBuild, 800);
}

const watchDirs = [
  path.join(ROOT, "src"),
  path.join(ROOT, "public"),
];

const excludePatterns = [
  /node_modules/,
  /build\//,
  /inpage-bundle|background-bundle|contentscript-bundle/,
];

function shouldExclude(filePath) {
  return excludePatterns.some((pattern) => pattern.test(filePath));
}

function watchDir(dir) {
  if (!fs.existsSync(dir)) return;
  log(`👀 Watching: ${dir}`);
  fs.watch(dir, { recursive: true }, (event, filename) => {
    if (!filename) return;
    const fullPath = path.join(dir, filename);
    if (shouldExclude(fullPath)) return;
    scheduleBuild(filename);
  });
}

// Initial build on startup
log("🚀 Starting initial build...");
runBuild();

// Watch directories
watchDirs.forEach(watchDir);

log('💡 Tip: After rebuild, go to chrome://extensions and click the Refresh ↻ icon on the extension.');
