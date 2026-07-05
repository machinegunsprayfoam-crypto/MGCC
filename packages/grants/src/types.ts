/**
 * Types for the MGCC grant finder + getter. Backed by the Granted grant
 * database (search 84k+ opportunities; 133k+ US foundations).
 *
 * Transport-agnostic: you inject a {@link GrantedCall} that runs a Granted tool
 * and returns its text result, so this works from the console, a server route,
 * or an agent regardless of how Granted is reached (MCP connector, API, …).
 */

/** Granted tool names this package calls. Map these in your {@link GrantedCall}. */
export const GRANTED_TOOLS = {
  searchGrants: "search_grants",
  getGrant: "get_grant",
  searchFunders: "search_funders",
  getFunder: "get_funder",
  getPastWinners: "get_past_winners",
} as const;

export type GrantedToolName = (typeof GRANTED_TOOLS)[keyof typeof GRANTED_TOOLS];

/**
 * Runs a Granted tool and returns its (text) result. Wire this to your Granted
 * transport — e.g. an MCP client call to `mcp__Granted__<tool>`.
 */
export type GrantedCall = (
  tool: GrantedToolName,
  args: Record<string, unknown>,
) => Promise<string>;

/** Applicant organization types Granted filters eligibility by. */
export const ORG_TYPES = [
  "Nonprofit",
  "University",
  "Small Business",
  "Individual",
  "Community Group",
  "HBCU",
  "Tribal",
  "FFRDC",
  "Government",
] as const;

/** A known org type, or any raw string Granted will normalize. */
export type OrgType = (typeof ORG_TYPES)[number] | (string & {});

/** Grant source categories. */
export type GrantSource = "federal" | "state" | "international" | "foundation";

/** Parameters for the grant finder ({@link findGrants}). */
export interface FindGrantsParams {
  /** Search terms, e.g. "weatherization energy efficiency insulation". */
  query: string;
  /**
   * Applicant org type — STRONGLY recommended for eligibility filtering
   * (MGCC is typically "Small Business").
   */
  orgType?: OrgType;
  /** Restrict to a source category. */
  source?: GrantSource;
  /** US state abbreviation filter (e.g. "MO", "CA"). */
  state?: string;
  /** Partial funder-name filter. */
  funder?: string;
  /** Include expired/closed grants (historical research). */
  includeHistorical?: boolean;
  /** Max results, 1–15 (Granted default 15). */
  limit?: number;
}

/** A single grant parsed from a finder result. */
export interface Grant {
  /** Grant name. */
  name: string;
  /** Granted slug (from the details URL), usable with {@link getGrant}. */
  slug?: string;
  funder?: string;
  /** Deadline text (often "No deadline" or a date). */
  deadline?: string;
  /** Award amount text (free-form). */
  amount?: string;
  summary?: string;
  /** Where to apply (funder's page). */
  applyUrl?: string;
  /** Granted details page. */
  detailsUrl?: string;
  /** Confidence label, e.g. "High Confidence". */
  confidence?: string;
  /** Fit score 0–99 (higher = better match), if present. */
  fitScore?: number;
  /** Reasons Granted matched this grant. */
  why: string[];
}

/** Result of the grant finder: parsed grants plus the raw text. */
export interface FindGrantsResult {
  grants: Grant[];
  /** Header count Granted reported ("Found N active grants…"), if present. */
  reportedCount?: number;
  /** The raw tool output (always kept — parsing is best-effort). */
  raw: string;
}

/** Result of the grant getter: the resolved slug/URL plus raw detail text. */
export interface GetGrantResult {
  slug: string;
  detailsUrl: string;
  raw: string;
}
