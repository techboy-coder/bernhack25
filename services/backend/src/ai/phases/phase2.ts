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
  "account": "account_type_if_specific_or_null",
  "reasoning": "brief explanation of your choice"
}

If scope is "specific", account MUST be one of: ${AVAILABLE_ACCOUNTS.join(", ")}
If scope is "generic", account should be null.

Examples:
- "Show me my savings" → specific: "high-yield"
- "Tell me about my savings account" → specific: "high-yield"
- "What saving habits do I have?" → generic: null // isn't necessarily about savings account
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

    const rawDecision = JSON.parse(jsonMatch[0]);

    // Validate the decision
    if (!["generic", "specific"].includes(rawDecision.scope)) {
      throw new Error(`Invalid phase2 scope: ${rawDecision.scope}`);
    }

    if (rawDecision.scope === "specific") {
      if (
        !rawDecision.account ||
        !AVAILABLE_ACCOUNTS.includes(rawDecision.account)
      ) {
        throw new Error(
          `Invalid or missing account for specific scope: ${rawDecision.account}`
        );
      }
    }

    // Create the final decision with derived accountId
    const decision: Phase2Decision = {
      scope: rawDecision.scope,
      account: rawDecision.account || undefined,
      accountId:
        rawDecision.scope === "specific" && rawDecision.account
          ? AccountsToId[rawDecision.account] || undefined
          : undefined,
      reasoning: rawDecision.reasoning,
    };

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
      account: undefined,
      accountId: undefined,
      reasoning:
        "Error occurred during phase 2 analysis, defaulting to generic scope",
    };
  }
}
