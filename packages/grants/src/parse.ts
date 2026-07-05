import { slugFromDetailsUrl } from "./params.js";
import type { Grant } from "./types.js";

function field(block: string, label: string): string | undefined {
  const m = block.match(new RegExp(`^${label}:\\s*(.+)$`, "m"));
  return m?.[1]?.trim();
}

/** Parse one grant block (the text between `---` separators) into a {@link Grant}. */
function parseGrantBlock(block: string): Grant | undefined {
  const nameLine = block.match(/^\*\*(.+?)\*\*(.*)$/m);
  if (!nameLine) return undefined;

  const name = (nameLine[1] ?? "").trim();
  const meta = nameLine[2] ?? "";
  const confidence = meta.match(/\[([^\]]+)\]/)?.[1]?.trim();
  const fitRaw = meta.match(/Fit:\s*(\d+)\s*\/\s*99/)?.[1];
  const fitScore = fitRaw !== undefined ? Number(fitRaw) : undefined;

  const detailsUrl = field(block, "Details");
  const whyRaw = field(block, "Why");

  return {
    name,
    slug: detailsUrl ? slugFromDetailsUrl(detailsUrl) : undefined,
    funder: field(block, "Funder"),
    deadline: field(block, "Deadline"),
    amount: field(block, "Amount"),
    summary: field(block, "Summary"),
    applyUrl: field(block, "Apply"),
    detailsUrl,
    confidence,
    fitScore,
    why: whyRaw
      ? whyRaw.split(";").map((w) => w.trim()).filter(Boolean)
      : [],
  };
}

/**
 * Parse a Granted `search_grants` text result into structured grants. Parsing
 * is best-effort and defensive — callers should keep the raw text too.
 */
export function parseGrantSearch(text: string): {
  grants: Grant[];
  reportedCount?: number;
} {
  const countRaw = text.match(/Found\s+(\d+)\s+active grants/i)?.[1];
  const reportedCount = countRaw !== undefined ? Number(countRaw) : undefined;

  // Drop the trailing "## Next Steps" guidance so it isn't parsed as a grant.
  const body = text.split(/^##\s+Next Steps/m)[0] ?? text;

  const grants: Grant[] = [];
  for (const block of body.split(/^-{3,}\s*$/m)) {
    if (!block.includes("**")) continue;
    const grant = parseGrantBlock(block);
    if (grant) grants.push(grant);
  }

  return { grants, reportedCount };
}
