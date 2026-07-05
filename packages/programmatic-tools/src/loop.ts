import {
  getContainerId,
  getProgrammaticToolUses,
} from "./content.js";
import { ProgrammaticToolError } from "./errors.js";
import type {
  MessageParam,
  MessagesResponse,
  ToolResultBlock,
  ToolUseBlock,
} from "./types.js";

/**
 * Build a `tool_result` block. For programmatic calls the content must be a
 * string or text blocks (image/document results are rejected), so a non-string
 * is coerced to a single text block.
 */
export function toolResult(
  toolUseId: string,
  content: string | Array<{ type: "text"; text: string }>,
): ToolResultBlock {
  return { type: "tool_result", tool_use_id: toolUseId, content };
}

/** Whether a response is paused waiting on programmatic tool results. */
export function isProgrammaticPause(response: MessagesResponse): boolean {
  return (
    response.stop_reason === "tool_use" &&
    getProgrammaticToolUses(response).length > 0
  );
}

export interface ToolRequest {
  model: string;
  max_tokens: number;
  messages: MessageParam[];
  tools: unknown[];
  /** Container id to reuse (a string, per the Messages API). */
  container?: string;
  [key: string]: unknown;
}

export interface RunToolLoopParams {
  /** Sends an assembled request and returns the response (your transport). */
  create: (request: ToolRequest) => Promise<MessagesResponse>;
  /** The initial request (same `tools` array is reused on every continuation). */
  request: ToolRequest;
  /**
   * Executes one tool call and returns the string result to feed back to the
   * running code. Called once per pending programmatic `tool_use`.
   */
  executeTool: (toolUse: ToolUseBlock) => Promise<string>;
  /** Max continuation turns before giving up. Default 10. */
  maxTurns?: number;
}

export interface RunToolLoopResult {
  /** The final response (completed, or a direct/other stop the caller handles). */
  response: MessagesResponse;
  /** Every response received, in order. */
  responses: MessagesResponse[];
  /** True if it stopped because it hit `maxTurns` while still paused. */
  exhausted: boolean;
  /**
   * True if it stopped on a direct `tool_use` (no programmatic calls). The
   * caller must handle that tool the traditional way.
   */
  directToolUse: boolean;
}

/**
 * Drive a programmatic tool calling request to completion.
 *
 * On each programmatic pause it runs every pending tool via `executeTool`,
 * answers with a user message containing **only** `tool_result` blocks (as the
 * API requires), reuses the container id (required while calls are pending),
 * and resends the same `tools`. Stops when the response completes, hits a
 * direct tool use, or exceeds `maxTurns`.
 */
export async function runToolLoop(
  args: RunToolLoopParams,
): Promise<RunToolLoopResult> {
  const { create, request, executeTool, maxTurns = 10 } = args;

  const messages = [...request.messages];
  let container = request.container;

  let response = await create({
    ...request,
    messages,
    ...(container !== undefined ? { container } : {}),
  });
  const responses = [response];

  let turns = 0;
  while (isProgrammaticPause(response)) {
    if (turns >= maxTurns) {
      return { response, responses, exhausted: true, directToolUse: false };
    }
    turns += 1;

    const containerId = getContainerId(response) ?? container;
    if (!containerId) {
      throw new ProgrammaticToolError(
        "A container id is required to answer pending programmatic tool calls, but none was returned",
      );
    }
    container = containerId;

    const pending = getProgrammaticToolUses(response);
    const results = await Promise.all(
      pending.map((tu) => executeTool(tu).then((c) => toolResult(tu.id, c))),
    );

    // The answering user message must contain ONLY tool_result blocks.
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: results });

    response = await create({ ...request, container, messages });
    responses.push(response);
  }

  const directToolUse = response.stop_reason === "tool_use";
  return { response, responses, exhausted: false, directToolUse };
}
