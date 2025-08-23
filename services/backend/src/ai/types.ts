// Define the three possible AI decision types
export type AIDecisionType = "generic" | "component" | "query";

// Phase 1: Determine if this is generic, component, or query
export type Phase1DecisionType = "generic" | "needs_analysis";

export interface Phase1Decision {
  type: Phase1DecisionType;
  reasoning: string;
}

// Phase 2: Determine account scope
export type AccountScope = "generic" | "specific";

export interface Phase2Decision {
  scope: AccountScope;
  accountId?: string; // Only present if scope is "specific"
  reasoning: string;
}

// Phase 3: Component or query decision
export type Phase3DecisionType = "component" | "query";

export interface Phase3Decision {
  type: Phase3DecisionType;
  content: string; // Component key or query description
  reasoning: string;
}

// Final combined decision
export interface AIDecision {
  type: AIDecisionType;
  content: string; // Generic response text, component key, or query parameters
  accountId?: string; // Only present for specific account queries
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

// Analysis context for passing between phases
export interface AnalysisContext {
  history: UserMessage[];
  newPrompt: string;
  conversationContext: string;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  currentRetry: number;
}
