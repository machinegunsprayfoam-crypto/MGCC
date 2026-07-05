import { describe, expect, it, vi } from "vitest";
import { GrantsService, MACHINE_GUN_SPRAY_FOAM, MODULE, IS_REGISTERED_MODULE } from "./index.js";
import type { DraftSender } from "./grants-service.js";
import type { GrantedCall } from "@mgcc/grants";
import type { MessagesResponse } from "@mgcc/mcp-connector";

const SEARCH_FIXTURE = `Found 1 active grants matching "weatherization":

---
**Weatherization Assistance Program (WAP)** [High Confidence] | Fit: 40/99
Funder: PA DCED
Deadline: No deadline
Amount: Not specified
Summary: State weatherization program.
Apply: https://dced.pa.gov/programs/weatherization-assistance-program-wap/
Details: https://grantedai.com/grants/weatherization-assistance-program-wap-pa-532ad009

Why: Matches your focus: weatherization`;

function draftResponse(text: string): MessagesResponse {
  return {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude-opus-4-8",
    stop_reason: "end_turn",
    content: [{ type: "text", text }],
  };
}

describe("module wiring", () => {
  it("is a registered MGCC module (ties in @mgcc/shared)", () => {
    expect(MODULE).toBe("ai-command-center");
    expect(IS_REGISTERED_MODULE).toBe(true);
  });
});

describe("GrantsService: find → get → draft", () => {
  function makeService(sender: DraftSender, backendId?: "anthropic" | "bedrock") {
    const grantedCall = vi.fn<GrantedCall>(async (tool) => {
      if (tool === "search_grants") return SEARCH_FIXTURE;
      if (tool === "get_grant") return "Eligibility: state weatherization agencies…";
      return "";
    });
    const service = new GrantsService({
      grantedCall,
      sender,
      company: MACHINE_GUN_SPRAY_FOAM,
      backendId,
    });
    return { service, grantedCall };
  }

  it("searches (finder) and returns parsed grants", async () => {
    const { service } = makeService(async () => draftResponse(""));
    const { grants } = await service.search({
      query: "weatherization",
      orgType: "Small Business",
    });
    expect(grants[0]?.funder).toBe("PA DCED");
    expect(grants[0]?.slug).toBe(
      "weatherization-assistance-program-wap-pa-532ad009",
    );
  });

  it("drafts an application end-to-end, fetching details and sending to the backend", async () => {
    const sender = vi.fn<DraftSender>(async (body) =>
      draftResponse(`DRAFT for ${(body.messages[0]!.content.match(/Name: (.+)/) ?? [])[1] ?? "?"}`),
    );
    const { service, grantedCall } = makeService(sender);

    const { grants } = await service.search({ query: "weatherization" });
    const result = await service.draftApplication({
      grant: grants[0]!,
      fetchDetails: true,
      projectSummary: "Insulate 40 homes with closed-cell spray foam.",
      requestedAmount: "$250,000",
    });

    // getter was called for details, then sender got the writer's request.
    expect(grantedCall).toHaveBeenCalledWith("get_grant", {
      slug: "weatherization-assistance-program-wap-pa-532ad009",
    });
    expect(result.grantDetails).toContain("Eligibility");
    expect(result.request.messages[0]!.content).toContain("Machine Gun Spray Foam");
    expect(result.request.messages[0]!.content).toContain("Insulate 40 homes");
    expect(result.draft).toContain("DRAFT for Weatherization Assistance Program");
  });

  it("formats the model id for the configured backend (ties in @mgcc/anthropic-backends)", async () => {
    const sender = vi.fn<DraftSender>(async () => draftResponse("ok"));
    const { service } = makeService(sender, "bedrock");

    const { grants } = await service.search({ query: "weatherization" });
    await service.draftApplication({ grant: grants[0]! });

    // Bedrock uses anthropic-prefixed model ids.
    expect(sender.mock.calls[0]![0].model).toBe("anthropic.claude-opus-4-8");
    expect(service.backend.operator).toBe("aws");
  });
});
