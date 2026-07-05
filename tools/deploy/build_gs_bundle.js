#!/usr/bin/env node
/**
 * Builds the Google Apps Script deploy bundle.
 *
 * Copies the authored Apps Script sources from deploy/ into app/ (the clasp
 * root, i.e. the directory that holds .clasp.json and gets pushed by
 * `clasp push`), and generates the appsscript.json manifest that configures
 * the Web app deployment.
 *
 * The generated files in app/ (*.gs, *.html, appsscript.json) are build
 * artifacts and are git-ignored; deploy/ is the source of truth.
 *
 * Usage:  node tools/deploy/build_gs_bundle.js
 *   (or)  pnpm build:gs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "deploy");
const OUT = path.join(ROOT, "app");

/** Apps Script manifest for a Web app deployment. Edit timeZone as needed. */
const MANIFEST = {
  timeZone: "America/New_York",
  dependencies: {},
  exceptionLogging: "STACKDRIVER",
  runtimeVersion: "V8",
  webapp: {
    executeAs: "USER_DEPLOYING",
    access: "ANYONE_ANONYMOUS",
  },
};

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`✖ Source directory not found: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const sources = fs
    .readdirSync(SRC)
    .filter((f) => f.endsWith(".gs") || f.endsWith(".html"));

  if (sources.length === 0) {
    console.error(`✖ No .gs or .html files found in ${SRC}`);
    process.exit(1);
  }

  for (const file of sources) {
    fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
    console.log(`  copied  deploy/${file} -> app/${file}`);
  }

  const manifestPath = path.join(OUT, "appsscript.json");
  fs.writeFileSync(manifestPath, JSON.stringify(MANIFEST, null, 2) + "\n");
  console.log("  wrote   app/appsscript.json");

  console.log(`\n✓ Bundle ready in app/ (${sources.length} source file(s)).`);
  console.log("  Next:  cd app && clasp push");
  console.log("  See:   15_SYSTEM/DEPLOY_NOW.md");
}

main();
