import { Hono } from "hono";
import { config } from "dotenv";

// Load environment variables
config();

// Define the three possible AI decision types
export type AIDecisionType = "generic" | "component" | "query";

export interface AIDecision {
  type: AIDecisionType;
  content: string; // Generic response text, component key, or query parameters
  reasoning?: string; // Optional explanation of why this decision was made
}

export interface UserMessage {
  id: string;
  content: string;
  timestamp: number;
  isUser: boolean;
}

export interface AIAnalysisRequest {
  history: UserMessage[];
  newPrompt: string;
}

export interface AIAnalysisResponse {
  decision: AIDecision;
  success: boolean;
  error?: string;
}

// LiteLLM configuration from environment variables with validation
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL;
const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

// Panic if critical environment variables are missing
if (!LITELLM_BASE_URL) {
  console.error("❌ FATAL: LITELLM_BASE_URL environment variable is not set!");
  console.error(
    "Please check your .env file and ensure LITELLM_BASE_URL is properly configured."
  );
  process.exit(1);
}

if (!LITELLM_API_KEY) {
  console.error("❌ FATAL: LITELLM_API_KEY environment variable is not set!");
  console.error(
    "Please check your .env file and ensure LITELLM_API_KEY is properly configured."
  );
  process.exit(1);
}

console.log(
  `✅ LiteLLM configured: ${LITELLM_BASE_URL} with model ${AI_MODEL}`
);

// Available components (imported from components.ts)
const AVAILABLE_COMPONENTS = [
  "account-header",
  "accounts-overview",
  "transaction-stats",
  "transaction-charts",
  "transaction-table",
  "transaction-overview",
  "savings-profiles",
  "savings-analysis",
  "recurrent-payment-stats",
  "recurrent-payment-grid",
  "recurrent-payment-categories",
  "upcoming-payments",
];

async function analyzeWithLiteLLM(
  history: UserMessage[],
  newPrompt: string
): Promise<AIDecision> {
  // Create conversation context
  const conversationContext = history
    .slice(-5) // Last 5 messages for context
    .map((msg) => `${msg.isUser ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `You are a banking assistant AI. Given a conversation history and a new user prompt, you must decide on exactly ONE of three response types:

1. "generic" - For general questions, greetings, or when you need to provide explanatory text
2. "component" - When the user wants to see specific banking data/interface (choose from: ${AVAILABLE_COMPONENTS.join(
    ", "
  )})
3. "query" - When the user wants to search, filter, or analyze specific banking data

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "type": "generic|component|query",
  "content": "your response content here",
  "reasoning": "brief explanation of your choice"
}

For "component" type, content must be EXACTLY one of the component keys.
For "query" type, content should describe the data query needed.
For "generic" type, content should be your response text.

Conversation History:
${conversationContext}

New User Prompt: ${newPrompt}`;

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
            content: newPrompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
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
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const decision = JSON.parse(jsonMatch[0]) as AIDecision;

    // Validate component key if type is "component"
    if (
      decision.type === "component" &&
      !AVAILABLE_COMPONENTS.includes(decision.content)
    ) {
      throw new Error(`Invalid component key: ${decision.content}`);
    }

    return decision;
  } catch (error) {
    console.error("LiteLLM analysis error:", error);
    // Fallback to generic response
    return {
      type: "generic",
      content:
        "I'm having trouble processing your request right now. Could you please rephrase your question?",
      reasoning:
        "Error occurred during analysis, defaulting to generic response",
    };
  }
}

export const ai_hono = new Hono()
  .get("/", (c) =>
    c.json({
      message: "AI Banking Assistant API",
      model: AI_MODEL,
      baseUrl: LITELLM_BASE_URL,
    })
  )

  .post("/analyze", async (c) => {
    try {
      const body = (await c.req.json()) as AIAnalysisRequest;
      const { history, newPrompt } = body;

      if (!newPrompt) {
        return c.json(
          {
            success: false,
            error: "Missing required field: newPrompt",
          },
          400
        );
      }

      const decision = await analyzeWithLiteLLM(history || [], newPrompt);

      const response: AIAnalysisResponse = {
        decision,
        success: true,
      };

      return c.json(response);
    } catch (error) {
      console.error("AI analysis endpoint error:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
          decision: {
            type: "generic",
            content:
              "I encountered an error processing your request. Please try again.",
            reasoning: "Error fallback",
          },
        } as AIAnalysisResponse,
        500
      );
    }
  })

  .get("/components", (c) => {
    return c.json({
      available: AVAILABLE_COMPONENTS,
      count: AVAILABLE_COMPONENTS.length,
    });
  });
