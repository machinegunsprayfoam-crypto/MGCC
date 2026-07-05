import { describe, expect, it } from "vitest";
import { GrantsError } from "./errors.js";
import {
  buildGetGrantArgs,
  buildSearchGrantsArgs,
  grantDetailsUrl,
  slugFromDetailsUrl,
} from "./params.js";

describe("buildSearchGrantsArgs", () => {
  it("maps typed params to Granted args", () => {
    expect(
      buildSearchGrantsArgs({
        query: "weatherization insulation",
        orgType: "Small Business",
        source: "state",
        state: "mo",
        includeHistorical: true,
        limit: 6,
      }),
    ).toEqual({
      query: "weatherization insulation",
      org_type: "Small Business",
      source: "state",
      state: "MO",
      include_historical: true,
      limit: 6,
    });
  });

  it("requires a non-empty query", () => {
    expect(() => buildSearchGrantsArgs({ query: "  " })).toThrow(GrantsError);
  });

  it("validates limit and state", () => {
    expect(() => buildSearchGrantsArgs({ query: "x", limit: 20 })).toThrow(/limit/);
    expect(() => buildSearchGrantsArgs({ query: "x", state: "Missouri" })).toThrow(
      /2-letter/,
    );
  });
});

describe("slug helpers", () => {
  it("builds a details URL", () => {
    expect(grantDetailsUrl("wap-pa-532ad009")).toBe(
      "https://grantedai.com/grants/wap-pa-532ad009",
    );
  });

  it("extracts a slug from a details URL or accepts a bare slug", () => {
    expect(
      slugFromDetailsUrl("https://grantedai.com/grants/wap-pa-532ad009"),
    ).toBe("wap-pa-532ad009");
    expect(slugFromDetailsUrl("wap-pa-532ad009")).toBe("wap-pa-532ad009");
    expect(slugFromDetailsUrl("https://example.com/other")).toBeUndefined();
  });

  it("buildGetGrantArgs resolves slug or throws", () => {
    expect(buildGetGrantArgs("wap-pa-532ad009")).toEqual({ slug: "wap-pa-532ad009" });
    expect(() => buildGetGrantArgs("not a slug at all")).toThrow(GrantsError);
  });
});
