import { GrantsError } from "./errors.js";
import type { Grant } from "./types.js";

/**
 * AI grant writer. Builds a Claude Messages request that drafts a grant
 * application from a grant + your company profile. Transport-agnostic: it
 * returns a request body you send with any backend (e.g. `@mgcc/mcp-connector`
 * or `@mgcc/anthropic-backends`) — this package doesn't call the API itself.
 */

/** MGCC's business profile — fill once, reuse for every application. */
export interface CompanyProfile {
  /** Legal business name, e.g. "Machine Gun Spray Foam & Concrete Lifting LLC". */
  legalName: string;
  /** Short description of what the business does. */
  description: string;
  /** Services offered (spray foam insulation, concrete lifting, weatherization…). */
  services: string[];
  /** US state the business operates in (2-letter), for eligibility framing. */
  state?: string;
  /** Org type for eligibility framing (usually "Small Business"). */
  orgType?: string;
  /** Optional extras that strengthen an application. */
  yearsInBusiness?: number;
  certifications?: string[];
  /** Certified small-business designations (e.g. "Veteran-Owned", "HUBZone"). */
  setAsides?: string[];
  /** Anything else the writer should weave in (differentiators, past work). */
  notes?: string;
}

/** Which application sections to draft. */
export type ApplicationSection =
  | "executive_summary"
  | "statement_of_need"
  | "project_description"
  | "goals_and_objectives"
  | "budget_narrative"
  | "organization_background"
  | "expected_outcomes"
  | "sustainability";

export const DEFAULT_SECTIONS: ApplicationSection[] = [
  "executive_summary",
  "organization_background",
  "statement_of_need",
  "project_description",
  "goals_and_objectives",
  "expected_outcomes",
  "budget_narrative",
];

export interface DraftApplicationParams {
  /** The grant to apply for (from the finder/getter). */
  grant: Grant;
  /** Optional full grant detail text (from `getGrant`) for richer grounding. */
  grantDetails?: string;
  /** The applicant business. */
  company: CompanyProfile;
  /** Sections to draft. Defaults to {@link DEFAULT_SECTIONS}. */
  sections?: ApplicationSection[];
  /** Free-text about the specific project this application funds. */
  projectSummary?: string;
  /** Requested funding amount, if known. */
  requestedAmount?: string;
  /** Model to target (default `claude-opus-4-8`). */
  model?: string;
  /** max_tokens for the draft (default 4096). */
  maxTokens?: number;
}

/** A minimal Messages API request body (send with any backend). */
export interface MessagesRequestBody {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user"; content: string }>;
  [key: string]: unknown;
}

const SECTION_TITLES: Record<ApplicationSection, string> = {
  executive_summary: "Executive Summary",
  statement_of_need: "Statement of Need",
  project_description: "Project Description",
  goals_and_objectives: "Goals and Objectives",
  budget_narrative: "Budget Narrative",
  organization_background: "Organization Background",
  expected_outcomes: "Expected Outcomes",
  sustainability: "Sustainability",
};

function companyBlock(c: CompanyProfile): string {
  const lines = [
    `Legal name: ${c.legalName}`,
    `Description: ${c.description}`,
    `Services: ${c.services.join(", ")}`,
  ];
  if (c.orgType) lines.push(`Organization type: ${c.orgType}`);
  if (c.state) lines.push(`State: ${c.state}`);
  if (c.yearsInBusiness !== undefined) {
    lines.push(`Years in business: ${c.yearsInBusiness}`);
  }
  if (c.certifications?.length) {
    lines.push(`Certifications: ${c.certifications.join(", ")}`);
  }
  if (c.setAsides?.length) {
    lines.push(`Set-aside designations: ${c.setAsides.join(", ")}`);
  }
  if (c.notes) lines.push(`Notes: ${c.notes}`);
  return lines.join("\n");
}

function grantBlock(g: Grant, details?: string): string {
  const lines = [`Name: ${g.name}`];
  if (g.funder) lines.push(`Funder: ${g.funder}`);
  if (g.amount) lines.push(`Amount: ${g.amount}`);
  if (g.deadline) lines.push(`Deadline: ${g.deadline}`);
  if (g.summary) lines.push(`Summary: ${g.summary}`);
  if (g.detailsUrl) lines.push(`Details URL: ${g.detailsUrl}`);
  if (details) lines.push(`\nFull details:\n${details}`);
  return lines.join("\n");
}

/**
 * Build the Claude request that drafts the application. Send the returned body
 * with your transport; the model's text response is the draft.
 *
 * The system prompt instructs Claude to ground claims in the supplied profile,
 * flag anything it had to assume, and never fabricate facts about the business.
 */
export function buildGrantApplicationRequest(
  params: DraftApplicationParams,
): MessagesRequestBody {
  const {
    grant,
    grantDetails,
    company,
    sections = DEFAULT_SECTIONS,
    projectSummary,
    requestedAmount,
    model = "claude-opus-4-8",
    maxTokens = 4096,
  } = params;

  if (!company.legalName?.trim()) {
    throw new GrantsError("company.legalName is required to draft an application");
  }
  if (sections.length === 0) {
    throw new GrantsError("at least one application section is required");
  }

  const sectionList = sections
    .map((s, i) => `${i + 1}. ${SECTION_TITLES[s]}`)
    .join("\n");

  const system = [
    "You are an expert grant writer helping a small business apply for funding.",
    "Draft a clear, specific, and persuasive application grounded ONLY in the",
    "company profile and grant details provided. Do not invent facts, numbers,",
    "certifications, or past performance about the business. Where a strong",
    "application would need information you were not given, insert a clearly",
    'marked placeholder like "[TODO: <what to provide>]" instead of fabricating.',
    "Match the funder's stated priorities and eligibility. Use a professional,",
    "concrete tone; prefer measurable outcomes over generic claims.",
  ].join(" ");

  const userParts = [
    "Draft a grant application with these sections, each under its own heading:",
    sectionList,
    "",
    "## Applicant business",
    companyBlock(company),
    "",
    "## Grant",
    grantBlock(grant, grantDetails),
  ];
  if (projectSummary) {
    userParts.push("", "## The project this application funds", projectSummary);
  }
  if (requestedAmount) {
    userParts.push("", `## Requested amount\n${requestedAmount}`);
  }
  userParts.push(
    "",
    "End with a short checklist of missing information the applicant must supply",
    "before submitting (the [TODO: …] items).",
  );

  return {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userParts.join("\n") }],
  };
}
