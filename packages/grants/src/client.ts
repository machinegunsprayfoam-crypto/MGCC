import {
  buildGetGrantArgs,
  buildSearchGrantsArgs,
  grantDetailsUrl,
} from "./params.js";
import { parseGrantSearch } from "./parse.js";
import {
  GRANTED_TOOLS,
  type FindGrantsParams,
  type FindGrantsResult,
  type GetGrantResult,
  type GrantedCall,
} from "./types.js";

/**
 * **Grant finder.** Search live grant opportunities and get back structured
 * {@link Grant}s (plus the raw text). Pass `orgType: "Small Business"` for MGCC
 * so results are eligibility-filtered.
 *
 * ```ts
 * const { grants } = await findGrants(call, {
 *   query: "weatherization insulation energy efficiency",
 *   orgType: "Small Business",
 *   state: "MO",
 * });
 * ```
 */
export async function findGrants(
  call: GrantedCall,
  params: FindGrantsParams,
): Promise<FindGrantsResult> {
  const raw = await call(GRANTED_TOOLS.searchGrants, buildSearchGrantsArgs(params));
  const { grants, reportedCount } = parseGrantSearch(raw);
  return { grants, reportedCount, raw };
}

/**
 * **Grant getter.** Fetch full details for a grant by slug or Granted details
 * URL (e.g. from a {@link Grant}'s `slug`/`detailsUrl`). Returns the resolved
 * slug + URL and the raw detail text (eligibility, application link, deadline).
 */
export async function getGrant(
  call: GrantedCall,
  slugOrUrl: string,
): Promise<GetGrantResult> {
  const args = buildGetGrantArgs(slugOrUrl);
  const raw = await call(GRANTED_TOOLS.getGrant, args);
  return { slug: args.slug, detailsUrl: grantDetailsUrl(args.slug), raw };
}

/** Search US foundations (name/state/NTEE/asset/income). Returns raw text. */
export async function searchFunders(
  call: GrantedCall,
  params: Record<string, unknown>,
): Promise<string> {
  return call(GRANTED_TOOLS.searchFunders, params);
}

/** Full foundation profile by slug or EIN. Returns raw text. */
export async function getFunder(
  call: GrantedCall,
  slugOrEin: string,
): Promise<string> {
  return call(GRANTED_TOOLS.getFunder, { slug_or_ein: slugOrEin });
}

/**
 * Competitive intelligence: who has won a federal grant program (by CFDA,
 * agency, program, or state). Returns raw text.
 */
export async function getPastWinners(
  call: GrantedCall,
  params: Record<string, unknown>,
): Promise<string> {
  return call(GRANTED_TOOLS.getPastWinners, params);
}
