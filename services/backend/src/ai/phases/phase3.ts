import type { Phase3Decision, AnalysisContext, RetryConfig } from "../types.js";
import {
  LITELLM_BASE_URL,
  LITELLM_API_KEY,
  AI_MODEL,
  AVAILABLE_COMPONENTS,
  type ComponentKey,
} from "../config.js";

export async function executePhase3(
  context: AnalysisContext,
  accountScope: string,
  retryConfig: RetryConfig = { maxRetries: 3, currentRetry: 0 }
): Promise<Phase3Decision> {
  const systemPrompt = `You are a banking assistant AI deciding between showing a component or performing a query.

Account scope: ${accountScope}
Available components: ${AVAILABLE_COMPONENTS.join(", ")}

Choose between:
1. "component" - Show a specific UI component with banking data
2. "query" - Perform a data search/filter (NOT YET IMPLEMENTED - will show WIP message)

When in doubt, ALWAYS choose "component" and pick the most relevant one.

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "type": "component|query", 
  "content": "component_key_or_query_description",
  "reasoning": "brief explanation of your choice",
  "accountType": "savings|personal|retirement|marriage|all" (optional - only for account-header component)
}

For "component" type, content MUST be exactly one of: ${AVAILABLE_COMPONENTS.join(
    ", "
  )}
For "query" type, content should describe the data query needed.

Component descriptions:
- "accounts-overview": Overview of all bank accounts when user asks for "all accounts", "account summary", or "account overview"
- "account-header": Detailed view of a specific single bank account - use for "my savings account", "savings account details", "tell me about my [specific account type]". ALWAYS specify accountType when using this component.
- "transaction-table": Detailed transaction list for accounts
- "transaction-stats": Transaction statistics and metrics
- "transaction-charts": Visual transaction analysis and trends
- "savings-profiles": Personal savings GOALS and financial targets (vacation fund, emergency fund, etc.) - NOT bank account balances
- "recurrent-payment-stats": Recurring payments and subscriptions overview

IMPORTANT DISTINCTIONS:
- For "my savings account", "savings account details", "tell me about my savings account" -> use "account-header" with accountType: "savings"
- For "my personal account", "checking account" -> use "account-header" with accountType: "personal"  
- For "my retirement account", "retirement fund" -> use "account-header" with accountType: "retirement"
- For "my marriage fund", "marriage account" -> use "account-header" with accountType: "marriage"
- For "show all accounts", "account overview", "all my accounts" -> use "accounts-overview" (all bank accounts)
- For "savings goals", "savings targets", "financial goals", "saving for vacation" etc. -> use "savings-profiles" (personal goals)
- For "transactions" questions -> use "transaction-table", "transaction-stats", or "transaction-charts"

EXAMPLES:
- "tell me about my savings account" -> account-header with accountType: "savings"
- "show my savings account" -> account-header with accountType: "savings"  
- "savings account info" -> account-header with accountType: "savings"
- "my high interest savings account" -> account-header with accountType: "savings"
- "personal checking account" -> account-header with accountType: "personal"
- "show all my accounts" -> accounts-overview (all bank accounts)
- "account overview" -> accounts-overview (all bank accounts)
- "my savings goals" -> savings-profiles (personal goals)
- "how much am I saving for vacation" -> savings-profiles (personal goals)

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

    const decision = JSON.parse(jsonMatch[0]) as Phase3Decision;

    // Validate the decision
    if (!["component", "query"].includes(decision.type)) {
      throw new Error(`Invalid phase3 decision type: ${decision.type}`);
    }

    if (
      decision.type === "component" &&
      !AVAILABLE_COMPONENTS.includes(decision.content as ComponentKey)
    ) {
      throw new Error(`Invalid component key: ${decision.content}`);
    }

    return decision;
  } catch (error) {
    console.error(
      `Phase 3 analysis error (attempt ${retryConfig.currentRetry + 1}):`,
      error
    );

    if (retryConfig.currentRetry < retryConfig.maxRetries) {
      return executePhase3(context, accountScope, {
        ...retryConfig,
        currentRetry: retryConfig.currentRetry + 1,
      });
    }

    // Final fallback to accounts-overview component
    return {
      type: "component",
      content: "accounts-overview",
      reasoning:
        "Error occurred during phase 3 analysis, defaulting to accounts-overview component",
    };
  }
}
