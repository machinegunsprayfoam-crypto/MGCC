import { describe, expect, it } from "vitest";
import { MGCC_MODULES, isMgccModule } from "./index.js";

describe("MGCC modules", () => {
  it("lists the planned platform modules", () => {
    expect(MGCC_MODULES).toContain("ai-command-center");
    expect(MGCC_MODULES).toContain("government-contracting");
    expect(new Set(MGCC_MODULES).size).toBe(MGCC_MODULES.length); // no dupes
  });

  it("isMgccModule narrows known ids", () => {
    expect(isMgccModule("crm")).toBe(true);
    expect(isMgccModule("not-a-module")).toBe(false);
  });
});
