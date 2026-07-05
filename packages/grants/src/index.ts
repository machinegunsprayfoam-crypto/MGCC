/**
 * `@mgcc/grants`
 *
 * Grant finder + getter for the MGCC AI Command Center console, backed by the
 * Granted database. Typed params, a parser that turns Granted's search output
 * into structured {@link Grant}s, and transport-agnostic callers — you inject a
 * {@link GrantedCall} so it works from the console, a server route, or an agent.
 */

export {
  GRANTED_TOOLS,
  ORG_TYPES,
  type FindGrantsParams,
  type FindGrantsResult,
  type GetGrantResult,
  type Grant,
  type GrantSource,
  type GrantedCall,
  type GrantedToolName,
  type OrgType,
} from "./types.js";

export { GrantsError } from "./errors.js";

export {
  buildGetGrantArgs,
  buildSearchGrantsArgs,
  grantDetailsUrl,
  slugFromDetailsUrl,
} from "./params.js";

export { parseGrantSearch } from "./parse.js";

export {
  findGrants,
  getFunder,
  getGrant,
  getPastWinners,
  searchFunders,
} from "./client.js";

export {
  DEFAULT_SECTIONS,
  buildGrantApplicationRequest,
  type ApplicationSection,
  type CompanyProfile,
  type DraftApplicationParams,
  type MessagesRequestBody,
} from "./writer.js";
