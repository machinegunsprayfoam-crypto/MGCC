import { describe, expect, it } from "vitest";
import { BackendConfigError } from "./errors.js";
import { resolveBaseUrl, vertexModelPath } from "./urls.js";

describe("resolveBaseUrl", () => {
  it("first-party is fixed", () => {
    expect(resolveBaseUrl("anthropic")).toBe("https://api.anthropic.com");
  });

  it("AWS backends interpolate the region", () => {
    expect(resolveBaseUrl("claude-platform-aws", { region: "us-west-2" })).toBe(
      "https://aws-external-anthropic.us-west-2.api.aws",
    );
    expect(resolveBaseUrl("bedrock", { region: "us-east-1" })).toBe(
      "https://bedrock-mantle.us-east-1.api.aws",
    );
    expect(resolveBaseUrl("bedrock-legacy", { region: "us-east-1" })).toBe(
      "https://bedrock-runtime.us-east-1.amazonaws.com",
    );
  });

  it("Vertex uses global / multi-region / regional hosts", () => {
    expect(resolveBaseUrl("vertex", { region: "global" })).toBe(
      "https://aiplatform.googleapis.com",
    );
    expect(resolveBaseUrl("vertex", { region: "us" })).toBe(
      "https://aiplatform.us.rep.googleapis.com",
    );
    expect(resolveBaseUrl("vertex", { region: "eu" })).toBe(
      "https://aiplatform.eu.rep.googleapis.com",
    );
    expect(resolveBaseUrl("vertex", { region: "us-east1" })).toBe(
      "https://us-east1-aiplatform.googleapis.com",
    );
  });

  it("Foundry uses the resource name", () => {
    expect(resolveBaseUrl("foundry", { resource: "example-resource" })).toBe(
      "https://example-resource.services.ai.azure.com/anthropic",
    );
  });

  it("throws when required region/resource is missing", () => {
    expect(() => resolveBaseUrl("bedrock")).toThrow(BackendConfigError);
    expect(() => resolveBaseUrl("vertex")).toThrow(BackendConfigError);
    expect(() => resolveBaseUrl("foundry")).toThrow(BackendConfigError);
  });
});

describe("vertexModelPath", () => {
  it("builds the model-in-URL path with the stream specifier", () => {
    expect(
      vertexModelPath({ projectId: "P", region: "global", model: "claude-opus-4-8" }),
    ).toBe(
      "/v1/projects/P/locations/global/publishers/anthropic/models/claude-opus-4-8:rawPredict",
    );
    expect(
      vertexModelPath({
        projectId: "P",
        region: "us-east1",
        model: "claude-opus-4-8",
        stream: true,
      }),
    ).toBe(
      "/v1/projects/P/locations/us-east1/publishers/anthropic/models/claude-opus-4-8:streamRawPredict",
    );
  });
});
