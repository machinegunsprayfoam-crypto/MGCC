import { getContainerId } from "./content.js";
import {
  buildSkillsRequest,
  type BuildSkillsRequestParams,
} from "./request.js";
import type { MessagesResponse } from "./types.js";

/** Whether a response paused a long-running Skill operation. */
export function isPauseTurn(response: MessagesResponse): boolean {
  return response.stop_reason === "pause_turn";
}

export interface RunToCompletionParams {
  /**
   * Sends an assembled request and returns the response. Supply your own
   * transport (e.g. the Anthropic beta Messages API) — this package stays
   * transport-agnostic.
   */
  create: (request: ReturnType<typeof buildSkillsRequest>) => Promise<MessagesResponse>;
  /** The request parameters (same shape as {@link buildSkillsRequest}). */
  params: BuildSkillsRequestParams;
  /** Max continuation turns before giving up. Default 10. */
  maxTurns?: number;
}

export interface RunToCompletionResult {
  /** The final (non-paused, or last) response. */
  response: MessagesResponse;
  /** Every response received, in order. */
  responses: MessagesResponse[];
  /** Whether the loop stopped because it hit `maxTurns` while still paused. */
  exhausted: boolean;
}

/**
 * Drive a Skills request to completion, continuing across `pause_turn` stops.
 *
 * On each pause it appends the assistant's content to the conversation, reuses
 * the returned container id, and resends — matching the documented long-running
 * operation loop. Returns once the response is no longer paused or `maxTurns`
 * continuations have run.
 */
export async function runToCompletion(
  args: RunToCompletionParams,
): Promise<RunToCompletionResult> {
  const { create, params, maxTurns = 10 } = args;

  const messages = [...params.messages];
  let containerId = params.containerId;

  let response = await create(
    buildSkillsRequest({ ...params, messages, containerId }),
  );
  const responses = [response];

  let turns = 0;
  while (isPauseTurn(response) && turns < maxTurns) {
    turns += 1;
    messages.push({ role: "assistant", content: response.content });
    containerId = getContainerId(response) ?? containerId;

    response = await create(
      buildSkillsRequest({ ...params, messages, containerId }),
    );
    responses.push(response);
  }

  return { response, responses, exhausted: isPauseTurn(response) };
}
