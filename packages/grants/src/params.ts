import { GrantsError } from "./errors.js";
import type { FindGrantsParams } from "./types.js";

const GRANT_DETAILS_PREFIX = "https://grantedai.com/grants/";

/** Build the Granted `search_grants` args from typed finder params (validated). */
export function buildSearchGrantsArgs(
  params: FindGrantsParams,
): Record<string, unknown> {
  const query = params.query?.trim();
  if (!query) {
    throw new GrantsError("findGrants requires a non-empty query");
  }
  if (params.limit !== undefined && (params.limit < 1 || params.limit > 15)) {
    throw new GrantsError(`limit must be between 1 and 15 (got ${params.limit})`);
  }
  if (params.state !== undefined && !/^[A-Za-z]{2}$/.test(params.state)) {
    throw new GrantsError(
      `state must be a 2-letter US abbreviation (got "${params.state}")`,
    );
  }

  const args: Record<string, unknown> = { query };
  if (params.orgType !== undefined) args.org_type = params.orgType;
  if (params.source !== undefined) args.source = params.source;
  if (params.state !== undefined) args.state = params.state.toUpperCase();
  if (params.funder !== undefined) args.funder = params.funder;
  if (params.includeHistorical !== undefined) {
    args.include_historical = params.includeHistorical;
  }
  if (params.limit !== undefined) args.limit = params.limit;
  return args;
}

/** The Granted details-page URL for a slug. */
export function grantDetailsUrl(slug: string): string {
  return `${GRANT_DETAILS_PREFIX}${slug}`;
}

/**
 * Extract a grant slug from a Granted details URL, or return the input if it's
 * already a bare slug. Returns undefined for anything unrecognizable.
 */
export function slugFromDetailsUrl(urlOrSlug: string): string | undefined {
  const value = urlOrSlug.trim();
  if (!value) return undefined;
  if (value.startsWith(GRANT_DETAILS_PREFIX)) {
    const slug = value.slice(GRANT_DETAILS_PREFIX.length).split(/[?#]/)[0];
    return slug || undefined;
  }
  // A bare slug (no scheme, no spaces).
  if (!value.includes("://") && !/\s/.test(value)) return value;
  return undefined;
}

/** Build the Granted `get_grant` args from a slug or details URL. */
export function buildGetGrantArgs(slugOrUrl: string): { slug: string } {
  const slug = slugFromDetailsUrl(slugOrUrl);
  if (!slug) {
    throw new GrantsError(`Could not resolve a grant slug from "${slugOrUrl}"`);
  }
  return { slug };
}
