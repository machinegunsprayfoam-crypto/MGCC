import { describe, expect, it, vi } from "vitest";
import { isPauseTurn, runToCompletion } from "./pause.js";
import { anthropicSkill } from "./skills.js";
import type { MessagesResponse } from "./types.js";

function resp(
  stop_reason: string,
  containerId = "container_1",
  content: MessagesResponse["content"] = [{ type: "text", text: "…" }],
): MessagesResponse {
  return {
    id: "msg",
    type: "message",
    role: "assistant",
    stop_reason,
    container: { id: containerId },
    content,
  };
}

const baseParams = {
  model: "claude-opus-4-8",
  max_tokens: 4096,
  messages: [{ role: "user" as const, content: "Process this large dataset" }],
  skills: [anthropicSkill("xlsx")],
};

describe("isPauseTurn", () => {
  it("detects pause_turn", () => {
    expect(isPauseTurn(resp("pause_turn"))).toBe(true);
    expect(isPauseTurn(resp("end_turn"))).toBe(false);
  });
});

describe("runToCompletion", () => {
  it("continues across pause_turn until completion", async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce(resp("pause_turn"))
      .mockResolvedValueOnce(resp("pause_turn"))
      .mockResolvedValueOnce(resp("end_turn"));

    const result = await runToCompletion({ create, params: baseParams });

    expect(create).toHaveBeenCalledTimes(3);
    expect(result.responses).toHaveLength(3);
    expect(result.exhausted).toBe(false);
    expect(result.response.stop_reason).toBe("end_turn");

    // Later turns reuse the container id and grow the message history.
    const lastReq = create.mock.calls[2]![0];
    expect(lastReq.container.id).toBe("container_1");
    expect(lastReq.messages).toHaveLength(3); // user + 2 appended assistant turns
    expect(lastReq.messages[1]).toEqual({ role: "assistant", content: [{ type: "text", text: "…" }] });
  });

  it("stops at maxTurns and reports exhaustion", async () => {
    const create = vi.fn().mockResolvedValue(resp("pause_turn"));

    const result = await runToCompletion({
      create,
      params: baseParams,
      maxTurns: 3,
    });

    // 1 initial call + 3 continuations.
    expect(create).toHaveBeenCalledTimes(4);
    expect(result.exhausted).toBe(true);
  });

  it("returns immediately when the first response is not paused", async () => {
    const create = vi.fn().mockResolvedValue(resp("end_turn"));
    const result = await runToCompletion({ create, params: baseParams });
    expect(create).toHaveBeenCalledTimes(1);
    expect(result.responses).toHaveLength(1);
  });
});
