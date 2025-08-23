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
  account?: string; // Account type (e.g., "personal", "high-yield", "retirement", "marriage")
  accountId?: string; // Derived from AccountsToId mapping, only present if scope is "specific"
  reasoning: string;
}

// Phase 3: Component or query decision
export type Phase3DecisionType = "component" | "query";

// Import the ComponentKey type from config
import type { ComponentKey } from "./config.js";

// Account type for specific account requests
export type AccountType =
  | "savings"
  | "personal"
  | "retirement"
  | "marriage"
  | "all";

// Separate interfaces for each decision type
export interface Phase3ComponentDecision {
  type: "component";
  content: ComponentKey | ComponentKey[]; // Updated to support multiple components
  reasoning: string;
  accountType?: AccountType; // Optional account type specification
}

export interface Phase3QueryDecision {
  type: "query";
  content: string;
  reasoning: string;
}

// Union type for Phase 3 decisions
export type Phase3Decision = Phase3ComponentDecision | Phase3QueryDecision;

// Final combined decision
export interface AIDecision {
  type: AIDecisionType;
  content: string | string[]; // Updated to support multiple components - Generic response text, component key(s), or query parameters
  ttsText?: string; // AI-generated text specifically for TTS speech
  accountId?: string; // Only present for specific account queries
  accountType?: AccountType; // Account type for component decisions
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
