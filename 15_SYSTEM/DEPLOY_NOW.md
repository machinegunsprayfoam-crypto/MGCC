# DEPLOY NOW — MGCC Google Apps Script Web App

Runbook for pushing the Machine Gun Command Center live as a **Google Apps
Script Web App**. Follow top to bottom the first time; after that, only the
[Redeploy](#5-redeploy-after-changes) step is needed.

## What gets deployed

| Path | Role |
| --- | --- |
| `deploy/Code.gs` | Authored Apps Script source (server logic + dashboard). **Edit here.** |
| `tools/deploy/build_gs_bundle.js` | Copies `deploy/` → `app/` and writes `appsscript.json`. |
| `app/` | The clasp root that gets pushed. Holds `.clasp.json` + generated bundle. |
| `app/.clasp.json.example` | Template for your local `.clasp.json` (git-ignored once copied). |
| `app/.claspignore` | Restricts the push to `*.gs` / `*.html` / `appsscript.json`. |

`app/*.gs`, `app/*.html`, `app/appsscript.json`, and `app/.clasp.json` are build
artifacts / local config and are git-ignored. `deploy/` is the source of truth.

## Deployment type

This project deploys as **Web app**. Apps Script's four deployment types are:

- **Web app** — HTTP endpoint via `doGet` / `doPost` (this project).
- **API executable** — call functions via the Apps Script API from other apps.
- **Add-on** — extends Google Workspace apps (Docs, Sheets, Gmail).
- **Library** — reusable code imported by other scripts.

## Prerequisites

- Node.js 20+ (already required by this repo).
- A Google account with access to [script.google.com](https://script.google.com).
- clasp installed: `npm install -g @google/clasp`

## 1. Authenticate clasp

```bash
clasp login
```

## 2. Create (or link) the Apps Script project

**New project:**

```bash
cd app
clasp create --title "MGCC — Command Center" --type webapp --rootDir .
```

This writes an `app/.clasp.json` with the new `scriptId`.

**Existing project:** copy the template and paste your script id:

```bash
cd app
cp .clasp.json.example .clasp.json
# then edit .clasp.json and set "scriptId" to your Apps Script project id
```

## 3. Build the bundle

From the repo root:

```bash
pnpm build:gs
# (equivalently: node tools/deploy/build_gs_bundle.js)
```

This copies `deploy/Code.gs` into `app/` and generates `app/appsscript.json`.

## 4. Push and deploy

```bash
cd app
clasp push          # upload the bundle to Apps Script
clasp deploy        # create a versioned Web app deployment
```

Grab the web app URL:

```bash
clasp deployments   # lists deployment ids
```

Then open the project in the browser to confirm the access settings
(**Deploy ▸ Manage deployments ▸ Web app**):

- **Execute as:** Me (`USER_DEPLOYING`) — set in `appsscript.json`.
- **Who has access:** Anyone (`ANYONE_ANONYMOUS`) — tighten to "Only myself"
  or your Workspace domain by editing `webapp.access` in
  `tools/deploy/build_gs_bundle.js` and rebuilding.

## 5. Redeploy after changes

```bash
pnpm build:gs
cd app && clasp push && clasp deploy
```

## Verify

Once deployed, the web app URL serves the Command Center dashboard. The same
URL doubles as a JSON API:

- `…/exec?api=health` → `{ "status": "ok", "modules": 11, … }`
- `…/exec?api=modules` → the module registry

## Notes

- `deploy/Code.gs` mirrors the module registry in
  `packages/shared/src/modules.ts`. Update both when modules change.
- Edit `timeZone` in `tools/deploy/build_gs_bundle.js` if the business is not
  in `America/New_York`.
