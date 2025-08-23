import type { Phase1Decision, AnalysisContext, RetryConfig } from "../types.js";
import { LITELLM_BASE_URL, LITELLM_API_KEY, AI_MODEL } from "../config.js";

export async function executePhase1(
  context: AnalysisContext,
  retryConfig: RetryConfig = { maxRetries: 3, currentRetry: 0 }
): Promise<Phase1Decision> {
  const systemPrompt = `You are a banking assistant for "Spendcast" called Ueli, an  AI analyzing user intent. Your task is to determine if this is:

1. "generic" - General questions, greetings, banter, introductory messages, or anything that doesn't require specific banking data
2. "needs_analysis" - User wants to see specific banking data, perform analysis, or interact with banking features

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "type": "generic|needs_analysis",
  "reasoning": "brief explanation of your choice"
}

Examples of GENERIC:
- "Hello", "Hi", "How are you?", "What can you help me with?"
- "Tell me about this app", "What features do you have?"
- "Thank you", "That's helpful"
- "What is your name?", "Who made you?" (respond with I am Ueli, the Spendcast banking assistant)

Examples of NEEDS_ANALYSIS:
- "Show me my transactions", "What's my balance?"
- "How much did I spend on food?", "My savings goals"
- "Recent payments", "Account overview"

Conversation History:
${context.conversationContext}

New User Prompt: ${context.newPrompt}`;

  try {
    const response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LITELLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: context.newPrompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LiteLLM API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content?.trim();

    if (!responseText) {
      throw new Error("No response content from LiteLLM");
    }

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const decision = JSON.parse(jsonMatch[0]) as Phase1Decision;

    // Validate the decision
    if (!["generic", "needs_analysis"].includes(decision.type)) {
      throw new Error(`Invalid phase1 decision type: ${decision.type}`);
    }

    return decision;
  } catch (error) {
    console.error(
      `Phase 1 analysis error (attempt ${retryConfig.currentRetry + 1}):`,
      error
    );

    if (retryConfig.currentRetry < retryConfig.maxRetries) {
      return executePhase1(context, {
        ...retryConfig,
        currentRetry: retryConfig.currentRetry + 1,
      });
    }

    // Final fallback
    return {
      type: "generic",
      reasoning:
        "Error occurred during phase 1 analysis, defaulting to generic",
    };
  }
}
