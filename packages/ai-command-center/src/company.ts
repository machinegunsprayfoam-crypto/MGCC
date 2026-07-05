import type { CompanyProfile } from "@mgcc/grants";

/**
 * Starter profile for Machine Gun Spray Foam & Concrete Lifting LLC. Fill in the
 * `[TODO]` fields (state, years, certifications, set-asides) to strengthen
 * drafts and reduce the placeholders the writer has to leave. Treat this as a
 * default the console overrides per application.
 */
export const MACHINE_GUN_SPRAY_FOAM: CompanyProfile = {
  legalName: "Machine Gun Spray Foam & Concrete Lifting LLC",
  description:
    "A specialty contractor providing spray foam insulation, building weatherization, and concrete lifting/leveling services.",
  services: [
    "spray foam insulation",
    "weatherization / air sealing",
    "concrete lifting and leveling",
  ],
  orgType: "Small Business",
  // state: "MO",                      // TODO: set the operating state (2-letter)
  // yearsInBusiness: 0,               // TODO
  // certifications: [],               // TODO: e.g. BPI, manufacturer certs
  // setAsides: [],                    // TODO: e.g. "Veteran-Owned", "HUBZone"
  notes:
    "TODO: add differentiators, service area, notable past projects, and any certifications or set-aside designations to strengthen applications.",
};
