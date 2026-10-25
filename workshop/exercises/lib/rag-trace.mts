import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type { Passage } from "../rag-mcp-client.mts";

// Supplied UI inspection: record the agent's actual calls and full MCP evidence.
export function observeRagSession(session: AgentSession) {
  const toolCalls: { name: string; arguments: Record<string, unknown> }[] = [];
  const evidence = new Map<string, Passage>();
  let failure: Error | undefined;

  session.subscribe((event) => {
    if (
      event.type === "message_end" &&
      event.message.role === "assistant" &&
      event.message.stopReason === "error"
    ) {
      failure = new Error(
        event.message.errorMessage || "The model request failed.",
      );
    }
    if (
      event.type === "tool_execution_start" &&
      event.toolName === "mcp__explorer__search_documents"
    ) {
      toolCalls.push({ name: event.toolName, arguments: event.args });
    }
    if (
      event.type === "tool_execution_end" &&
      event.toolName === "mcp__explorer__search_documents" &&
      !event.isError
    ) {
      const result = event.result as {
        structuredContent?: { structuredContent?: { hits?: Passage[] } };
      };
      for (const passage of result.structuredContent?.structuredContent?.hits ??
        []) {
        evidence.set(passage.id, passage);
      }
    }
  });

  return () => {
    if (failure) throw failure;
    return {
      evidence: [...evidence.values()],
      toolCalls,
      messages: [
        { role: "system", content: session.systemPrompt },
        ...session.messages,
      ],
    };
  };
}
