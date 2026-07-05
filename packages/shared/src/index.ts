/**
 * `@mgcc/shared`
 *
 * Shared types and utilities for the MGCC platform. This is the common package
 * every app and service can depend on; keep it dependency-free so it stays
 * cheap to import everywhere.
 */

/** The platform modules planned for MGCC (see the root README). */
export const MGCC_MODULES = [
  "crm",
  "estimating",
  "field-bid",
  "bpi-energy-audit",
  "project-management",
  "inventory",
  "fleet-equipment",
  "government-contracting",
  "ai-command-center",
  "customer-portal",
  "reporting",
] as const;

/** A module identifier. */
export type MgccModule = (typeof MGCC_MODULES)[number];

/** Whether a string is a known MGCC module id. */
export function isMgccModule(value: string): value is MgccModule {
  return (MGCC_MODULES as readonly string[]).includes(value);
}
