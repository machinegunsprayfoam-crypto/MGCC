import { describe, expect, it } from "vitest";
import {
  allowlist,
  deferAll,
  denylist,
  enableAllTools,
  resolveToolConfig,
} from "./toolset.js";

describe("toolset builders", () => {
  it("enableAllTools returns a bare toolset", () => {
    expect(enableAllTools("srv")).toEqual({
      type: "mcp_toolset",
      mcp_server_name: "srv",
    });
  });

  it("allowlist disables by default and enables named tools", () => {
    expect(allowlist("srv", ["a", "b"])).toEqual({
      type: "mcp_toolset",
      mcp_server_name: "srv",
      default_config: { enabled: false },
      configs: { a: { enabled: true }, b: { enabled: true } },
    });
  });

  it("allowlist merges per-tool overrides", () => {
    const set = allowlist("srv", ["a"], { a: { defer_loading: true } });
    expect(set.configs?.a).toEqual({ enabled: true, defer_loading: true });
  });

  it("denylist enables all and disables named tools", () => {
    expect(denylist("srv", ["danger"])).toEqual({
      type: "mcp_toolset",
      mcp_server_name: "srv",
      configs: { danger: { enabled: false } },
    });
  });

  it("deferAll defers everything and can eager-load a few", () => {
    expect(deferAll("srv", ["search"])).toEqual({
      type: "mcp_toolset",
      mcp_server_name: "srv",
      default_config: { defer_loading: true },
      configs: { search: { defer_loading: false } },
    });
    expect(deferAll("srv")).toEqual({
      type: "mcp_toolset",
      mcp_server_name: "srv",
      default_config: { defer_loading: true },
    });
  });
});

describe("resolveToolConfig", () => {
  it("applies configs > default_config > system defaults", () => {
    const set = deferAll("srv", ["search"]);
    // search overrides defer_loading back to false
    expect(resolveToolConfig(set, "search")).toEqual({
      enabled: true,
      defer_loading: false,
    });
    // other tools inherit default_config.defer_loading: true
    expect(resolveToolConfig(set, "other")).toEqual({
      enabled: true,
      defer_loading: true,
    });
  });

  it("matches the documented merge example", () => {
    const set = {
      type: "mcp_toolset" as const,
      mcp_server_name: "google-calendar-mcp",
      default_config: { defer_loading: true },
      configs: { search_events: { enabled: false } },
    };
    expect(resolveToolConfig(set, "search_events")).toEqual({
      enabled: false,
      defer_loading: true,
    });
    expect(resolveToolConfig(set, "list_events")).toEqual({
      enabled: true,
      defer_loading: true,
    });
  });
});
