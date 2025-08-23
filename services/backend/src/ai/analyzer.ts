import type { AIDecision, UserMessage, AnalysisContext } from "./types.js";
import { AccountsToId } from "./config.js";
import { executePhase1 } from "./phases/phase1.js";
import { executePhase2 } from "./phases/phase2.js";
import { executePhase3 } from "./phases/phase3.js";
import { LITELLM_BASE_URL, LITELLM_API_KEY, AI_MODEL } from "./config.js";

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
      const genericResponse = await generateGenericResponse(
        newPrompt,
        conversationContext
      );
      return {
        type: "generic",
        content: genericResponse.content,
        ttsText: genericResponse.ttsText,
        reasoning: phase1Result.reasoning,
      };
    }

    // Phase 2: Determine account scope
    console.log("🔍 Phase 2: Analyzing account scope...");
    const phase2Result = await executePhase2(context);
    console.log("✅ Phase 2 result:", phase2Result);

    // Phase 3: Determine component or query
    console.log("🔍 Phase 3: Generating component/query decision...");
    const phase3Result = await executePhase3(context, phase2Result.scope);
    console.log("✅ Phase 3 result:", phase3Result);

    if (phase3Result.type === "component") {
      const ttsText = await generateComponentTTSResponse(
        newPrompt,
        phase3Result.content,
        phase2Result.accountId,
        phase3Result.accountType,
        conversationContext
      );

      return {
        type: "component",
        content: phase3Result.content,
        ttsText,
        accountId: phase2Result.accountId,
        accountType: phase3Result.accountType,
        reasoning: phase3Result.reasoning,
      };
    } else {
      return {
        type: "query",
        content: phase3Result.content,
        reasoning: phase3Result.reasoning,
      };
    }
  } catch (error) {
    console.error("❌ Analysis error:", error);
    const fallbackResponse = await generateGenericResponse(
      "I encountered an error processing your request. Please try again.",
      conversationContext
    );
    return {
      type: "generic",
      content: fallbackResponse.content,
      ttsText: fallbackResponse.ttsText,
      reasoning: "Error fallback",
    };
  }
}

async function generateGenericResponse(
  prompt: string,
  conversationContext: string
): Promise<{ content: string; ttsText: string }> {
  const systemPrompt = `You are Ueli, a friendly and helpful banking assistant for Spendcast. Generate a personalized response to the user's message.

Guidelines for responses:
- Be kind, warm, and professional
- Use a conversational, approachable tone
- Keep responses concise but informative
- Offer specific help related to banking features
- Be encouraging and supportive
- Never be rude, dismissive, or overly formal
- Use "I" statements to make it personal ("I can help you with...")
- Show enthusiasm for helping with their financial goals

Available banking features you can mention:
- View account balances and summaries
- Analyze spending patterns and transaction history
- Track and manage savings goals
- Monitor recurring payments and subscriptions
- Generate financial insights and reports

Conversation History:
${conversationContext}

Generate a response that feels natural and personally crafted for this specific interaction. The response should be suitable for both text display and text-to-speech.`;

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
            content: prompt,
          },
        ],
        temperature: 0.7, // Higher temperature for more creative responses
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LiteLLM API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error("No response content from LiteLLM");
    }

    return {
      content: aiResponse,
      ttsText: aiResponse, // Same text for both display and TTS for generic responses
    };
  } catch (error) {
    console.error("Error generating generic response:", error);
    // Fallback to a simple response
    return {
      content:
        "I'm here to help you with your banking needs. What would you like to explore?",
      ttsText:
        "I'm here to help you with your banking needs. What would you like to explore?",
    };
  }
}

async function generateComponentTTSResponse(
  userPrompt: string,
  components: string | string[],
  accountId?: string,
  accountType?: string,
  conversationContext?: string
): Promise<string> {
  const componentList = Array.isArray(components) ? components : [components];
  const componentNames = componentList.join(", ");

  const systemPrompt = `You are Ueli, a friendly banking assistant for Spendcast. Generate a natural, conversational introduction for the financial component(s) being shown to the user.

Guidelines:
- Be warm, personal, and enthusiastic
- Keep it concise (1-2 sentences max)
- Sound natural when spoken aloud
- Acknowledge what the user asked for specifically
- Use "Here's" or "I've found" or "Let me show you" type language
- Be encouraging about their financial management
- Don't be overly formal or robotic

Component(s) being shown: ${componentNames}
${accountType ? `Account type: ${accountType}` : ""}
${accountId ? `Specific account: ${accountId}` : ""}

User's original request: "${userPrompt}"

Conversation context:
${conversationContext || "No previous context"}

Generate a brief, natural introduction that sounds good when spoken aloud.`;

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
            content: userPrompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `LiteLLM API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error("No response content from LiteLLM");
    }

    return aiResponse;
  } catch (error) {
    console.error("Error generating component TTS response:", error);
    // Fallback to a simple response
    return `Here's the information you requested.`;
  }
}
