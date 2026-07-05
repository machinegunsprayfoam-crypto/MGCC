# Machine Gun Command Center (MGCC)

MGCC is the unified operating platform for Machine Gun Spray Foam & Concrete Lifting LLC.

## Planned Modules
- CRM
- Estimating Engine
- Field Bid App
- BPI Energy Audit
- Project Management
- Inventory
- Fleet & Equipment
- Government Contracting
- AI Command Center
- Customer Portal
- Reporting

This repository will become the primary codebase for the platform.

## Structure

- `deploy/` — authored Google Apps Script source (`Code.gs`). Source of truth.
- `app/` — clasp root; the deploy bundle is generated here and pushed.
- `tools/deploy/` — `build_gs_bundle.js`, the bundle build.
- `packages/shared/` — `@mgcc/shared`: canonical module registry and domain
  types. `deploy/Code.gs` mirrors its module list.
- `15_SYSTEM/` — operational runbooks.

## Deployment

MGCC deploys as a **Google Apps Script Web app**, restricted to the Machine
Gun Google Workspace domain. Build and ship with:

```bash
pnpm build:gs        # generate the app/ bundle
pnpm deploy          # build + clasp push + clasp deploy
```

See [`15_SYSTEM/DEPLOY_NOW.md`](15_SYSTEM/DEPLOY_NOW.md) for first-time setup.
