import { config } from "dotenv";
import { listBankAccounts } from "../../func/listBankAccounts";

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
  "accounts-overview",
  "account-header",
  "transaction-table",
  "transaction-stats",
  "transaction-charts",
  "transaction-overview",
  "savings-profiles",
  "savings-analysis",
  "recurrent-payment-stats",
  "recurrent-payment-grid",
  "recurrent-payment-categories",
  "upcoming-payments",
] as const;

// Available components type
export type ComponentKey = (typeof AVAILABLE_COMPONENTS)[number];

// Function to dynamically generate AccountsToId mapping from actual database accounts
function generateAccountsToId() {
  try {
    const accounts = listBankAccounts();
    const accountsMap: Record<string, string> = { generic: "" };

    for (const accountSummary of accounts) {
      const account = accountSummary.account;
      switch (account.type) {
        case "personal":
          accountsMap.personal = account.id;
          break;
        case "savings":
          accountsMap["high-yield"] = account.id;
          break;
        case "retirement":
          accountsMap.retirement = account.id;
          break;
        case "marriage":
          accountsMap.marriage = account.id;
          break;
      }
    }

    return accountsMap;
  } catch (error) {
    console.error("Error loading account IDs from database:", error);
    // Fallback to empty mapping if there's an error
    return {
      personal: "",
      "high-yield": "",
      retirement: "",
      marriage: "",
      generic: "",
    };
  }
}

// Dynamically generated account mapping from actual database
export const AccountsToId = generateAccountsToId();

// Available accounts list (excluding generic)
export const AVAILABLE_ACCOUNTS = Object.keys(AccountsToId).filter(
  (key) => key !== "generic"
);
