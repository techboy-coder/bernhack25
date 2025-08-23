import type { AIDecision, UserMessage, AnalysisContext } from "./types.js";
import { AccountsToId } from "./config.js";
import { executePhase1 } from "./phases/phase1.js";
import { executePhase2 } from "./phases/phase2.js";
import { executePhase3 } from "./phases/phase3.js";

export async function analyzeWithLiteLLM(
  history: UserMessage[],
  newPrompt: string
): Promise<AIDecision> {
  // Create conversation context
  const conversationContext = history
    .slice(-5) // Last 5 messages for context
    .map((msg) => `${msg.isUser ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const context: AnalysisContext = {
    history,
    newPrompt,
    conversationContext,
  };

  try {
    // Phase 1: Determine if generic or needs analysis
    console.log("🔍 Phase 1: Analyzing intent...");
    const phase1Result = await executePhase1(context);
    console.log("✅ Phase 1 result:", phase1Result);

    if (phase1Result.type === "generic") {
      return {
        type: "generic",
        content: generateGenericResponse(newPrompt),
        reasoning: phase1Result.reasoning,
      };
    }

    // Phase 2: Determine account scope
    console.log("🔍 Phase 2: Analyzing account scope...");
    const phase2Result = await executePhase2(context);
    console.log("✅ Phase 2 result:", phase2Result);

    // Phase 3: Component or query decision
    const accountScope =
      phase2Result.scope === "specific"
        ? `specific account: ${phase2Result.accountId}`
        : "all accounts";

    console.log("🔍 Phase 3: Determining component or query...");
    const phase3Result = await executePhase3(context, accountScope);
    console.log("✅ Phase 3 result:", phase3Result);

    // Handle query type (not implemented)
    if (phase3Result.type === "query") {
      console.log("⚠️ Query WIP:", phase3Result.content);
      return {
        type: "generic",
        content:
          "Query functionality is work in progress. Please try asking for a specific view or overview instead.",
        reasoning: "Query functionality not yet implemented",
      };
    }

    // Build final decision
    const finalDecision: AIDecision = {
      type: "component",
      content: phase3Result.content,
      reasoning: `${phase1Result.reasoning} → ${phase2Result.reasoning} → ${phase3Result.reasoning}`,
    };

    // Add accountId if specific scope
    if (phase2Result.scope === "specific" && phase2Result.accountId) {
      const accountId =
        AccountsToId[phase2Result.accountId as keyof typeof AccountsToId];
      if (accountId) {
        finalDecision.accountId = accountId;
      }
    }

    return finalDecision;
  } catch (error) {
    console.error("Multi-phase analysis error:", error);
    return {
      type: "generic",
      content:
        "I encountered an error processing your request. Could you please try rephrasing your question?",
      reasoning: "Error fallback from multi-phase analysis",
    };
  }
}

function generateGenericResponse(prompt: string): string {
  const lowercasePrompt = prompt.toLowerCase();

  if (lowercasePrompt.includes("hello") || lowercasePrompt.includes("hi")) {
    return "Hello! I'm your banking assistant. I can help you view your accounts, analyze transactions, track savings goals, and manage recurring payments. What would you like to see?";
  }

  if (
    lowercasePrompt.includes("help") ||
    lowercasePrompt.includes("what can you do")
  ) {
    return "I can help you with:\n• View account balances and summaries\n• Analyze your spending patterns\n• Track savings goals\n• Monitor recurring payments\n• Show transaction history and statistics\n\nJust ask me about any of these topics!";
  }

  if (lowercasePrompt.includes("thank")) {
    return "You're welcome! Let me know if you need anything else with your banking data.";
  }

  return "I'm here to help you with your banking needs. You can ask me to show your accounts, analyze transactions, or check your savings goals. What would you like to explore?";
}
