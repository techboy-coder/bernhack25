import type { Phase2Decision, AnalysisContext, RetryConfig } from "../types.js";
import {
  LITELLM_BASE_URL,
  LITELLM_API_KEY,
  AI_MODEL,
  AVAILABLE_ACCOUNTS,
  AccountsToId,
} from "../config.js";

export async function executePhase2(
  context: AnalysisContext,
  retryConfig: RetryConfig = { maxRetries: 3, currentRetry: 0 }
): Promise<Phase2Decision> {
  const systemPrompt = `You are a banking assistant AI analyzing account scope. Determine if the user is asking about:

1. "generic" - All accounts or general banking overview
2. "specific" - A specific account type

Available account types: ${AVAILABLE_ACCOUNTS.join(", ")}

Account mappings:
- "personal" refers to personal checking account
- "high-yield" refers to high-yield savings account  
- "retirement" refers to retirement fund (3rd Pillar)
- "marriage" refers to marriage fund account

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "scope": "generic|specific",
  "accountId": "account_type_if_specific_or_null",
  "reasoning": "brief explanation of your choice"
}

If scope is "specific", accountId MUST be one of: ${AVAILABLE_ACCOUNTS.join(
    ", "
  )}
If scope is "generic", accountId should be null.

Examples:
- "Show me my savings" → specific: "high-yield"
- "Tell me about my savings account" → specific: "high-yield"
- "What saving habits do I have?" → specific: "generic" // isn't necessarily about savings account
- "My retirement fund" → specific: "retirement" 
- "Personal account balance" → specific: "personal"
- "All my accounts" → generic: null
- "Total balance" → generic: null

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

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const decision = JSON.parse(jsonMatch[0]) as Phase2Decision;

    // Validate the decision
    if (!["generic", "specific"].includes(decision.scope)) {
      throw new Error(`Invalid phase2 scope: ${decision.scope}`);
    }

    if (decision.scope === "specific") {
      if (
        !decision.accountId ||
        !AVAILABLE_ACCOUNTS.includes(decision.accountId)
      ) {
        throw new Error(
          `Invalid or missing accountId for specific scope: ${decision.accountId}`
        );
      }
    }

    return decision;
  } catch (error) {
    console.error(
      `Phase 2 analysis error (attempt ${retryConfig.currentRetry + 1}):`,
      error
    );

    if (retryConfig.currentRetry < retryConfig.maxRetries) {
      return executePhase2(context, {
        ...retryConfig,
        currentRetry: retryConfig.currentRetry + 1,
      });
    }

    // Final fallback to generic
    return {
      scope: "generic",
      reasoning:
        "Error occurred during phase 2 analysis, defaulting to generic scope",
    };
  }
}
