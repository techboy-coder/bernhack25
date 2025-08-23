import { Hono } from "hono";
import { analyzeWithLiteLLM } from "./analyzer.js";
import { LITELLM_BASE_URL, AI_MODEL, AVAILABLE_COMPONENTS } from "./config.js";
import type {
  AIDecisionType,
  AIDecision,
  UserMessage,
  AIAnalysisRequest,
  AIAnalysisResponse,
} from "./types.js";

// Export types for use by other modules
export type {
  AIDecisionType,
  AIDecision,
  UserMessage,
  AIAnalysisRequest,
  AIAnalysisResponse,
};

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

      console.log(`🤖 Starting multi-phase analysis for: "${newPrompt}"`);
      const decision = await analyzeWithLiteLLM(history || [], newPrompt);
      console.log(`🎯 Final decision:`, decision);

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
