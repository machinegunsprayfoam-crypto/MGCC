import { describe, expect, it, vi } from "vitest";
import { findGrants, getGrant } from "./client.js";
import { WEATHERIZATION_SEARCH_FIXTURE } from "./fixtures.js";
import type { GrantedCall } from "./types.js";

describe("findGrants", () => {
  it("calls search_grants with mapped args and returns parsed grants", async () => {
    const call = vi.fn<GrantedCall>().mockResolvedValue(WEATHERIZATION_SEARCH_FIXTURE);

    const result = await findGrants(call, {
      query: "weatherization insulation",
      orgType: "Small Business",
      limit: 6,
    });

    expect(call).toHaveBeenCalledWith("search_grants", {
      query: "weatherization insulation",
      org_type: "Small Business",
      limit: 6,
    });
    expect(result.reportedCount).toBe(6);
    expect(result.grants[0]?.funder).toBe("USDA Rural Development");
    expect(result.raw).toBe(WEATHERIZATION_SEARCH_FIXTURE);
  });
});

describe("getGrant", () => {
  it("resolves a slug from a details URL and calls get_grant", async () => {
    const call = vi.fn<GrantedCall>().mockResolvedValue("…full grant details…");

    const result = await getGrant(
      call,
      "https://grantedai.com/grants/wap-pa-532ad009",
    );

    expect(call).toHaveBeenCalledWith("get_grant", { slug: "wap-pa-532ad009" });
    expect(result.slug).toBe("wap-pa-532ad009");
    expect(result.detailsUrl).toBe("https://grantedai.com/grants/wap-pa-532ad009");
    expect(result.raw).toBe("…full grant details…");
  });
});
