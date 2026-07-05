import {
  buildGrantApplicationRequest,
  findGrants,
  getGrant,
  type ApplicationSection,
  type CompanyProfile,
  type FindGrantsParams,
  type FindGrantsResult,
  type GetGrantResult,
  type Grant,
  type GrantedCall,
  type MessagesRequestBody,
} from "@mgcc/grants";
import {
  getResponseText,
  type McpConnectorClient,
  type MessagesResponse,
} from "@mgcc/mcp-connector";
import {
  formatModelId,
  getBackend,
  type Backend,
  type BackendId,
} from "@mgcc/anthropic-backends";

/**
 * Sends the writer's Claude request and returns the response. Wire it to your
 * backend — e.g. `senderFromMcpConnector(client)`.
 */
export type DraftSender = (body: MessagesRequestBody) => Promise<MessagesResponse>;

/** Adapt an {@link McpConnectorClient} into a {@link DraftSender}. */
export function senderFromMcpConnector(client: McpConnectorClient): DraftSender {
  return (body) => client.send(body as unknown as Record<string, unknown>);
}

export interface GrantsServiceOptions {
  /** Runs Granted tools (finder/getter). */
  grantedCall: GrantedCall;
  /** Sends the writer's draft request to a Claude backend. */
  sender: DraftSender;
  /** Default applicant profile (override per draft if needed). */
  company?: CompanyProfile;
  /** Which Claude backend the draft targets (formats the model id). Default "anthropic". */
  backendId?: BackendId;
  /** Base model id (default "claude-opus-4-8"); formatted per backend. */
  model?: string;
}

export interface DraftApplicationInput {
  grant: Grant;
  /** Fetch full grant details (getter) first for richer grounding. */
  fetchDetails?: boolean;
  projectSummary?: string;
  requestedAmount?: string;
  sections?: ApplicationSection[];
  /** Override the default company profile for this draft. */
  company?: CompanyProfile;
}

export interface DraftApplicationResult {
  /** The drafted application text. */
  draft: string;
  /** The exact request that was sent (auditable). */
  request: MessagesRequestBody;
  /** The raw model response. */
  response: MessagesResponse;
  /** Grant detail text used, if `fetchDetails` was set. */
  grantDetails?: string;
}

/**
 * One service that ties the grant packages together for the console:
 * **find → get → draft**, sending the draft through a Claude backend.
 */
export class GrantsService {
  constructor(private readonly options: GrantsServiceOptions) {}

  /** Grant finder. */
  search(params: FindGrantsParams): Promise<FindGrantsResult> {
    return findGrants(this.options.grantedCall, params);
  }

  /** Grant getter. */
  getDetails(slugOrUrl: string): Promise<GetGrantResult> {
    return getGrant(this.options.grantedCall, slugOrUrl);
  }

  /** The Claude backend this service targets. */
  get backend(): Backend {
    return getBackend(this.options.backendId ?? "anthropic");
  }

  /** AI grant writer: draft an application and send it to the backend. */
  async draftApplication(
    input: DraftApplicationInput,
  ): Promise<DraftApplicationResult> {
    const company = input.company ?? this.options.company;
    if (!company) {
      throw new Error(
        "draftApplication needs a company profile (pass one, or set options.company)",
      );
    }

    let grantDetails: string | undefined;
    if (input.fetchDetails && input.grant.slug) {
      grantDetails = (await this.getDetails(input.grant.slug)).raw;
    }

    const backendId = this.options.backendId ?? "anthropic";
    const model = formatModelId(backendId, this.options.model ?? "claude-opus-4-8");

    const request = buildGrantApplicationRequest({
      grant: input.grant,
      grantDetails,
      company,
      projectSummary: input.projectSummary,
      requestedAmount: input.requestedAmount,
      sections: input.sections,
      model,
    });

    const response = await this.options.sender(request);
    return { draft: getResponseText(response), request, response, grantDetails };
  }
}
