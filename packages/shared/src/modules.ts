/**
 * Central registry of MGCC platform modules.
 *
 * This is the single source of truth for the platform's top-level surface area.
 * The web dashboard, navigation, and (eventually) permission checks all derive
 * from this list, so adding a module here wires it into the shell automatically.
 */

export type ModuleStatus = "live" | "beta" | "planned";

export interface PlatformModule {
  /** Stable identifier, also used as the route segment (`/crm`, `/estimating`, ...). */
  readonly id: string;
  /** Human-readable name shown in navigation and on cards. */
  readonly name: string;
  /** One-line description of what the module does. */
  readonly description: string;
  /** Delivery status, used to badge the module in the UI. */
  readonly status: ModuleStatus;
  /** Emoji glyph used as a lightweight icon until a proper icon set lands. */
  readonly icon: string;
}

export const MODULES: readonly PlatformModule[] = [
  {
    id: "crm",
    name: "CRM",
    description: "Leads, customers, and communication history in one place.",
    status: "planned",
    icon: "\u{1F465}", // 👥
  },
  {
    id: "estimating",
    name: "Estimating Engine",
    description: "Build accurate spray foam and concrete lifting quotes fast.",
    status: "planned",
    icon: "\u{1F4CF}", // 📏
  },
  {
    id: "field-bid",
    name: "Field Bid App",
    description: "Capture measurements and generate bids on-site.",
    status: "planned",
    icon: "\u{1F4F1}", // 📱
  },
  {
    id: "energy-audit",
    name: "BPI Energy Audit",
    description: "BPI-aligned energy audits and reporting for retrofits.",
    status: "planned",
    icon: "\u{1F50B}", // 🔋
  },
  {
    id: "projects",
    name: "Project Management",
    description: "Schedule, track, and close out jobs from bid to invoice.",
    status: "planned",
    icon: "\u{1F5C2}", // 🗂
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Track chemical sets, materials, and consumables.",
    status: "planned",
    icon: "\u{1F4E6}", // 📦
  },
  {
    id: "fleet",
    name: "Fleet & Equipment",
    description: "Rigs, trucks, and equipment maintenance and assignment.",
    status: "planned",
    icon: "\u{1F69B}", // 🚛
  },
  {
    id: "gov-contracting",
    name: "Government Contracting",
    description: "Track solicitations, bids, and compliance for gov work.",
    status: "planned",
    icon: "\u{1F3DB}", // 🏛
  },
  {
    id: "ai-command",
    name: "AI Command Center",
    description: "AI-assisted operations, insights, and automation.",
    status: "planned",
    icon: "\u{1F9E0}", // 🧠
  },
  {
    id: "customer-portal",
    name: "Customer Portal",
    description: "Self-service portal for quotes, approvals, and updates.",
    status: "planned",
    icon: "\u{1F6AA}", // 🚪
  },
  {
    id: "reporting",
    name: "Reporting",
    description: "Cross-module dashboards and business intelligence.",
    status: "planned",
    icon: "\u{1F4CA}", // 📊
  },
] as const;

/** Look up a module by its id / route segment. */
export function getModule(id: string): PlatformModule | undefined {
  return MODULES.find((m) => m.id === id);
}

/** All module ids, useful for generating static routes. */
export function moduleIds(): readonly string[] {
  return MODULES.map((m) => m.id);
}
