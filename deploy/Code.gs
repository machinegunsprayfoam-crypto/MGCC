/**
 * MGCC — Machine Gun Command Center
 * Google Apps Script server entry point (Web App deployment type).
 *
 * This is the authored source of truth. The build step
 * (tools/deploy/build_gs_bundle.js) copies this file into app/ — the clasp
 * root — from which `clasp push` uploads it to the Apps Script project.
 *
 * Deployment type: Web app (executeAs USER_DEPLOYING, access configurable).
 * The other Apps Script deployment types are API executable, Add-on, and
 * Library; see 15_SYSTEM/DEPLOY_NOW.md.
 */

/**
 * Registry of MGCC platform modules.
 *
 * Mirror of packages/shared/src/modules.ts (MODULES). Apps Script cannot
 * import the TypeScript workspace package, so this list is kept in sync by
 * hand — update both when adding or renaming a module.
 */
var MODULES = [
  { id: 'crm', name: 'CRM', description: 'Leads, customers, and communication history in one place.', status: 'planned', icon: '👥' },
  { id: 'estimating', name: 'Estimating Engine', description: 'Build accurate spray foam and concrete lifting quotes fast.', status: 'planned', icon: '📏' },
  { id: 'field-bid', name: 'Field Bid App', description: 'Capture measurements and generate bids on-site.', status: 'planned', icon: '📱' },
  { id: 'energy-audit', name: 'BPI Energy Audit', description: 'BPI-aligned energy audits and reporting for retrofits.', status: 'planned', icon: '🔋' },
  { id: 'projects', name: 'Project Management', description: 'Schedule, track, and close out jobs from bid to invoice.', status: 'planned', icon: '🗂' },
  { id: 'inventory', name: 'Inventory', description: 'Track chemical sets, materials, and consumables.', status: 'planned', icon: '📦' },
  { id: 'fleet', name: 'Fleet & Equipment', description: 'Rigs, trucks, and equipment maintenance and assignment.', status: 'planned', icon: '🚛' },
  { id: 'gov-contracting', name: 'Government Contracting', description: 'Track solicitations, bids, and compliance for gov work.', status: 'planned', icon: '🏛' },
  { id: 'ai-command', name: 'AI Command Center', description: 'AI-assisted operations, insights, and automation.', status: 'planned', icon: '🧠' },
  { id: 'customer-portal', name: 'Customer Portal', description: 'Self-service portal for quotes, approvals, and updates.', status: 'planned', icon: '🚪' },
  { id: 'reporting', name: 'Reporting', description: 'Cross-module dashboards and business intelligence.', status: 'planned', icon: '📊' }
];

/**
 * Web app HTTP entry point.
 *
 * - `?api=health`  -> JSON liveness payload (mirrors /api/health in apps/web)
 * - `?api=modules` -> JSON module registry
 * - otherwise      -> the Command Center HTML dashboard
 */
function doGet(e) {
  var api = e && e.parameter ? e.parameter.api : null;
  if (api === 'health') return jsonOutput_(healthCheck());
  if (api === 'modules') return jsonOutput_(getModules());

  return HtmlService.createHtmlOutput(renderPage_())
    .setTitle('MGCC — Machine Gun Command Center')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Returns the module registry. Also callable from client via google.script.run. */
function getModules() {
  return MODULES;
}

/** Liveness payload for uptime checks. */
function healthCheck() {
  return {
    status: 'ok',
    service: 'mgcc-apps-script',
    version: '0.0.1',
    modules: MODULES.length,
    timestamp: new Date().toISOString()
  };
}

/** Wraps an object as a JSON HTTP response. */
function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Builds the Command Center dashboard HTML from the module registry. */
function renderPage_() {
  var cards = MODULES.map(function (m) {
    return (
      '<a class="card" href="?module=' + encodeURIComponent(m.id) + '">' +
      '<div class="card-top"><span class="icon">' + m.icon + '</span>' +
      '<span class="badge">' + escapeHtml_(m.status) + '</span></div>' +
      '<h2>' + escapeHtml_(m.name) + '</h2>' +
      '<p>' + escapeHtml_(m.description) + '</p></a>'
    );
  }).join('');

  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<style>' +
    ':root{color-scheme:dark}' +
    '*{box-sizing:border-box}' +
    'body{margin:0;background:#0b0f14;color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    'header{border-bottom:1px solid rgba(255,255,255,.1);background:#12181f}' +
    '.bar{max-width:1100px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}' +
    '.brand{font-weight:600;letter-spacing:-.01em}' +
    '.ver{font-size:12px;color:#ff7a45;background:rgba(255,90,31,.1);padding:4px 10px;border-radius:999px}' +
    'main{max-width:1100px;margin:0 auto;padding:40px 24px}' +
    'h1{font-size:24px;margin:0 0 8px}' +
    '.sub{color:#94a3b8;max-width:640px}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:32px}' +
    '.card{display:flex;flex-direction:column;gap:10px;padding:20px;border:1px solid rgba(255,255,255,.1);' +
    'background:#12181f;border-radius:12px;text-decoration:none;color:inherit;transition:border-color .15s,background .15s}' +
    '.card:hover{border-color:rgba(255,90,31,.5);background:rgba(255,255,255,.03)}' +
    '.card-top{display:flex;align-items:flex-start;justify-content:space-between}' +
    '.icon{font-size:28px}' +
    '.badge{font-size:11px;color:#94a3b8;background:rgba(255,255,255,.08);padding:2px 10px;border-radius:999px}' +
    '.card h2{font-size:16px;margin:0}.card p{margin:0;font-size:14px;color:#94a3b8}' +
    '</style></head><body>' +
    '<header><div class="bar"><div class="brand">🔫 Machine Gun Command Center</div>' +
    '<div class="ver">v0.0.1</div></div></header>' +
    '<main><h1>Command Center</h1>' +
    '<p class="sub">The unified operating platform for Machine Gun Spray Foam &amp; Concrete Lifting. ' +
    'Every part of the business — from the first lead to the final invoice — runs from here.</p>' +
    '<div class="grid">' + cards + '</div></main></body></html>'
  );
}

/** Minimal HTML-escaping for interpolated registry strings. */
function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
