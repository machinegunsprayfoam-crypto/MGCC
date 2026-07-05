/**
 * `@mgcc/ai-command-center`
 *
 * The integration layer for MGCC's AI Command Center module. It depends on and
 * wires together the standalone `@mgcc/*` Claude packages into console-ready
 * services. First service: grants (find → get → draft), composing
 * `@mgcc/grants` + `@mgcc/mcp-connector` + `@mgcc/anthropic-backends`.
 */

import { isMgccModule } from "@mgcc/shared";

/** The MGCC module this package implements. */
export const MODULE = "ai-command-center" as const;

/** True — `MODULE` is a registered MGCC module (guards against drift). */
export const IS_REGISTERED_MODULE: boolean = isMgccModule(MODULE);

export {
  GrantsService,
  senderFromMcpConnector,
  type DraftApplicationInput,
  type DraftApplicationResult,
  type DraftSender,
  type GrantsServiceOptions,
} from "./grants-service.js";

export { MACHINE_GUN_SPRAY_FOAM } from "./company.js";
