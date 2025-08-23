import { config } from "dotenv";

// Load environment variables
config();

// LiteLLM configuration from environment variables with validation
export const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL;
export const LITELLM_API_KEY = process.env.LITELLM_API_KEY;
export const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

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
export const AVAILABLE_COMPONENTS = [
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

export const AccountsToId = {
  personal: "bf2d10a8-2303-485f-aa84-6064a73ac215",
  "high-yield": "f831779d-985e-4483-8800-5849dfc8ea7f",
  retirement: "c416bdbe-ea67-401b-965d-fb68d713e1ce",
  marriage: "4e78e497-9512-4534-96f7-ebd8e1bb4987",
  generic: "",
};

export const AVAILABLE_ACCOUNTS = Object.keys(AccountsToId);
