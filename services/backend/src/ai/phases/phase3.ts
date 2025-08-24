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
    const systemPrompt = `You are a banking assistant for "Spendcast" called Ueli, an AI deciding between showing a component or performing a query.

Account scope: ${accountScope}
Available components: ${AVAILABLE_COMPONENTS.join(", ")}

Choose between:
1. "component" - Show a specific UI component with banking data (up to 2 components max) - ONLY if there's a clear, relevant match
2. "query" - Perform a natural language data search/analysis of financial data - use this for specific questions, calculations, or when no component fits well

IMPORTANT: Don't force a component choice if none fit well. Use "query" when:
- User asks specific numerical questions ("How much did I spend on X?", "How many transactions?")
- No component clearly matches the request
- User wants calculations, analysis, or specific data points
- User asks about trends, comparisons, or specific time periods

RESPOND WITH VALID JSON ONLY in this exact format:
For single component:
{
  "type": "component", 
  "content": "component_key",
  "reasoning": "brief explanation of your choice",
  "accountType": "savings|personal|retirement|marriage|all" (optional - only for account-header component)
}

For multiple components (max 2):
{
  "type": "component", 
  "content": ["component_key_1", "component_key_2"],
  "reasoning": "brief explanation of your choice",
  "accountType": "savings|personal|retirement|marriage|all" (optional - only for account-header component)
}

For query:
{
  "type": "query",
  "content": "natural language query about financial data",
  "reasoning": "brief explanation of your choice"
}

For "component" type, content MUST be exactly one of or an array of: ${AVAILABLE_COMPONENTS.join(
        ", "
    )}
For "query" type, content should be the natural language question to search the financial data.

Use "query" for questions like:
- "How many groceries were bought last month?"
- "What's my total spending on transport?"
- "How much did I spend on entertainment this year?"
- "Show me my average monthly expenses"
- "How many transactions were made in December?"
- "What did I buy at Migros last week?"
- "Find my largest expense this month"
- "Show me all purchases over $100"
- Any specific numerical or analytical questions about financial data
- Questions that don't have a clear component match

Component descriptions:
- "accounts-overview": Overview of all bank accounts when user asks for "all accounts", "account summary", or "account overview"
- "account-header": Detailed view of a specific single bank account - use for "my savings account", "savings account details", "tell me about my [specific account type]". ALWAYS specify accountType when using this component.
- "transaction-table": Detailed transaction list for accounts
- "transaction-stats": Transaction statistics and metrics
- "transaction-charts": Visual transaction analysis and trends
- "transaction-overview": High-level summary of recent transactions
- "savings-profiles": Personal savings GOALS and financial targets (vacation fund, emergency fund, etc.) - NOT bank account balances
- "savings-analysis": Analysis of savings performance and goal achievement
- "recurrent-payment-stats": Recurring payments and subscriptions overview
- "recurrent-payment-grid": Grid view of all recurring payments. abilty to add new recurring payments here only!
- "recurrent-payment-categories": Categorized breakdown of recurring payments
- "upcoming-payments": Calendar view of upcoming recurring payments

MULTIPLE COMPONENT EXAMPLES:
- "show me spending analysis" -> ["transaction-stats", "transaction-charts"]
- "transaction overview and details" -> ["transaction-overview", "transaction-table"]
- "savings goals and performance" -> ["savings-profiles", "savings-analysis"]
- "recurring payments overview" -> ["recurrent-payment-stats", "recurrent-payment-grid"]

IMPORTANT DISTINCTIONS:
- For "my savings account", "savings account details", "tell me about my savings account" -> use "account-header" with accountType: "savings"
- For "my personal account", "checking account" -> use "account-header" with accountType: "personal"  
- For "my retirement account", "retirement fund" -> use "account-header" with accountType: "retirement"
- For "my marriage fund", "marriage account" -> use "account-header" with accountType: "marriage"
- For "show all accounts", "account overview", "all my accounts" -> use "accounts-overview" (all bank accounts)
- For "savings goals", "savings targets", "financial goals", "saving for vacation" etc. -> use "savings-profiles" (personal goals)
- For "transactions" questions -> use "transaction-table", "transaction-stats", or "transaction-charts".

You MUST round to the nearest whole number for any numerical values in queries!!! 12.423 -> 12. Use whole numbers only.

Note that for query response might fail and you might need to:
- Provide approximate values/ranges
- Take absolute values
- Provide best-effort estimates
- If data is missing, respond with a helpful fallback message

Conversation History:
${context.conversationContext}

New User Prompt: ${context.newPrompt}`;

    try {
        const response = await fetch(
            `${LITELLM_BASE_URL}/v1/chat/completions`,
            {
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
            }
        );

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

        if (decision.type === "component") {
            // Handle both single component and array of components
            const components = Array.isArray(decision.content)
                ? decision.content
                : [decision.content];

            // Limit to maximum 2 components
            if (components.length > 2) {
                components.splice(2);
                decision.content = components as ComponentKey | ComponentKey[];
            }

            // Validate each component
            for (const component of components) {
                if (!AVAILABLE_COMPONENTS.includes(component as ComponentKey)) {
                    throw new Error(`Invalid component key: ${component}`);
                }
            }

            // Update content back to single item if only one component
            if (components.length === 1) {
                decision.content = components[0] as ComponentKey;
            } else {
                decision.content = components as ComponentKey[];
            }
        } else if (decision.type === "query") {
            // For query type, we'll execute the query and return the human response
            try {
                const queryResponse = await fetch(
                    "http://127.0.0.1:3000/api/query",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ query: decision.content }),
                    }
                );

                if (queryResponse.ok) {
                    const queryResult = await queryResponse.json();

                    // Check if we got a meaningful response
                    if (
                        queryResult.success &&
                        queryResult.humanResponse &&
                        !queryResult.humanResponse.includes(
                            "I couldn't find"
                        ) &&
                        !queryResult.humanResponse.includes(
                            "I didn't find any results"
                        ) &&
                        !queryResult.humanResponse.includes(
                            "I'm not quite sure how to interpret"
                        )
                    ) {
                        // We got a good response, use it
                        decision.content = queryResult.humanResponse;
                    } else {
                        // Query didn't return useful data, provide a helpful response as Ueli
                        decision.content = `I looked through your financial data but couldn't find specific information about "${decision.content}". This might be because the data isn't available for that particular query, or it might be phrased in a way that's hard to search. Could you try asking about it differently, or would you like me to show you a relevant overview instead?`;
                    }
                } else {
                    // Fallback response if query service fails
                    decision.content = `I'm having trouble accessing your financial data right now to answer "${decision.content}". The analysis service might be temporarily unavailable. Could you try asking again in a moment?`;
                }
            } catch (error) {
                console.error("Error executing financial query:", error);
                // Provide a helpful response as Ueli rather than a technical error
                decision.content = `I encountered an issue while searching for information about "${decision.content}". This might be a temporary technical problem. In the meantime, is there something else I can help you with regarding your finances?`;
            }
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

        // Final fallback - try to be helpful rather than just showing accounts-overview
        return {
            type: "query",
            content:
                "I'm having some technical difficulties right now, but I'm here to help with your banking questions. Could you try asking me again about what you'd like to know?",
            reasoning:
                "Error occurred during phase 3 analysis, providing helpful fallback response",
        };
    }
}
