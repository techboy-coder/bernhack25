import { config } from "dotenv";

// Load environment variables first
config();

import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";
import {
  listBankAccounts,
  listTransactions,
  listTransactionsForBankAccount,
  listSavingsProfiles,
  listSavingsProfile,
  createSavingsProfile,
  listRecurrentPayments,
  listRecurrentPaymentsByAccount,
  createRecurrentPaymentEntry,
  getRecurrentPayment,
  updateRecurrentPaymentEntry,
  deleteRecurrentPaymentEntry,
} from "../func";
import {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from "./goalsData";
import type {
  IncomeCategory,
  ExpenseCategory,
  RecurrentPayment,
  SavingsProfile,
} from "./schema";
import { ai_hono } from "./ai";
// Export AI types for frontend use
export type {
  AIDecisionType,
  AIDecision,
  UserMessage,
  AIAnalysisRequest,
  AIAnalysisResponse,
} from "./ai";

const OCR_HOSTNAME = "localhost";
const OCR_PORT = "8081";
const JSON_QUERY_HOSTNAME = "127.0.0.1";
const JSON_QUERY_PORT = "9000";

// Use the same filter type as in the functions
type TransactionFilter = {
  timeRange?: {
    start?: number;
    end?: number;
  };
  type?: "income" | "expense";
  categories?: (keyof typeof IncomeCategory | keyof typeof ExpenseCategory)[];
};

interface CreateSavingsProfileRequest {
  name: string;
  targetAmount: number;
  targetDate?: number;
}

interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  category: string;
  targetDate?: string;
  startDate?: string;
}

interface CreateRecurrentPaymentRequest {
  amount: number;
  name: string;
  category:
    | "other"
    | "food"
    | "groceries"
    | "transport"
    | "housing"
    | "utilities"
    | "healthcare"
    | "entertainment"
    | "education"
    | "shopping"
    | "travel";
  frequency: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate?: string;
  autoPay?: boolean;
  savingsProfile?: string;
}

// JSON Query types
interface JsonQueryRequest {
  query: string;
}

interface JsonQueryResponse {
  result: any;
  responses: any[];
}

// Helper function to intelligently process JSON query results
function processQueryResult(
  result: any,
  responses: any[],
  query: string
): string {
  // Handle null or undefined results
  if (result === null || result === undefined) {
    // Check if any of the responses have valid data
    const validResponses = responses.filter(
      (r) => r !== null && r !== undefined
    );
    if (validResponses.length > 0) {
      result = validResponses[0]; // Take first valid response
    } else {
      return "I'm sorry, I couldn't find the specific information you're looking for in your financial data. Could you try rephrasing your question or be more specific?";
    }
  }

  // Handle negative values - take absolute value for amounts
  if (typeof result === "number" && result < 0) {
    result = Math.abs(result);
  }

  // Handle array of numbers with negatives
  if (Array.isArray(result)) {
    result = result.map((item) => {
      if (typeof item === "number" && item < 0) {
        return Math.abs(item);
      }
      return item;
    });
  }

  // Generate human-friendly response based on query content
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("how many") || lowerQuery.includes("count")) {
    if (typeof result === "number") {
      return `Based on your financial data, I found ${result} items matching your query.`;
    } else if (Array.isArray(result)) {
      return `I found ${
        result.length
      } items. Here's what I discovered: ${JSON.stringify(result)}`;
    }
  }

  if (
    lowerQuery.includes("total") ||
    lowerQuery.includes("sum") ||
    lowerQuery.includes("amount")
  ) {
    if (typeof result === "number") {
      return `The total amount comes to $${result.toFixed(2)}.`;
    } else if (
      Array.isArray(result) &&
      result.every((item) => typeof item === "number")
    ) {
      const sum = result.reduce((a, b) => a + b, 0);
      return `The total amount is $${sum.toFixed(
        2
      )} (individual amounts: ${result
        .map((r) => `$${r.toFixed(2)}`)
        .join(", ")}).`;
    }
  }

  if (lowerQuery.includes("average") || lowerQuery.includes("mean")) {
    if (typeof result === "number") {
      return `The average comes out to $${result.toFixed(2)}.`;
    } else if (
      Array.isArray(result) &&
      result.every((item) => typeof item === "number")
    ) {
      const avg = result.reduce((a, b) => a + b, 0) / result.length;
      return `The average is $${avg.toFixed(2)}.`;
    }
  }

  // Generic response for other types of data
  if (typeof result === "string") {
    return `Here's what I found: ${result}`;
  } else if (typeof result === "number") {
    return `The result is: ${result}`;
  } else if (Array.isArray(result)) {
    if (result.length === 0) {
      return "I didn't find any results matching your query. You might want to try a different time period or category.";
    } else if (result.length === 1) {
      return `I found one result: ${JSON.stringify(result[0])}`;
    } else {
      return `I found ${
        result.length
      } results. Here are the details: ${JSON.stringify(result)}`;
    }
  } else if (typeof result === "object") {
    return `Here's what I found: ${JSON.stringify(result)}`;
  }

  // Fallback response
  return `I found some information, but I'm not quite sure how to interpret it in a meaningful way. The raw result is: ${JSON.stringify(
    result
  )}. Could you try asking your question differently?`;
}

// API routes
const api = new Hono()
  .get("/bank-accounts", (c) => {
    try {
      const bankAccounts = listBankAccounts();
      return c.json(bankAccounts);
    } catch (error) {
      return c.json({ error: "Failed to fetch bank accounts" }, 500);
    }
  })
  .post("/query", async (c) => {
    try {
      const body: JsonQueryRequest = await c.req.json();
      const { query } = body;

      if (!query || typeof query !== "string" || query.trim().length === 0) {
        return c.json(
          { error: "Query is required and must be a non-empty string" },
          400
        );
      }

      // Call the JSON query service
      const response = await fetch(
        `http://${JSON_QUERY_HOSTNAME}:${JSON_QUERY_PORT}/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: query.trim() }),
        }
      );

      if (!response.ok) {
        console.error(
          `JSON Query service error: ${response.status} ${response.statusText}`
        );
        return c.json(
          {
            error:
              "I'm having trouble processing your query right now. Our analysis service might be temporarily unavailable. Please try again in a moment.",
            humanResponse:
              "Sorry, I'm having some technical difficulties analyzing your financial data right now. Can you try asking again in a few seconds?",
          },
          500
        );
      }

      const queryResult: JsonQueryResponse = await response.json();

      // Process the result intelligently
      const humanResponse = processQueryResult(
        queryResult.result,
        queryResult.responses,
        query
      );

      return c.json({
        query,
        result: queryResult.result,
        responses: queryResult.responses,
        humanResponse,
        success: true,
      });
    } catch (error) {
      console.error("Error processing query:", error);

      // Provide helpful error messages based on error type
      let humanResponse =
        "I encountered an issue while trying to analyze your question. ";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        humanResponse +=
          "It seems our analysis service is currently offline. Please try again later.";
      } else if (error instanceof SyntaxError) {
        humanResponse +=
          "There was a problem understanding the data format. This is a technical issue on our end.";
      } else {
        humanResponse +=
          "This might be a temporary glitch. Could you try rephrasing your question or asking again?";
      }

      return c.json(
        {
          error: "Failed to process query",
          humanResponse,
          success: false,
        },
        500
      );
    }
  })
  .get("/transactions", (c) => {
    try {
      const query = c.req.query();
      const filter: TransactionFilter = {};

      // Parse query parameters for filtering
      if (query.startDate)
        filter.timeRange = {
          ...filter.timeRange,
          start: parseInt(query.startDate),
        };
      if (query.endDate)
        filter.timeRange = {
          ...filter.timeRange,
          end: parseInt(query.endDate),
        };
      if (query.type && (query.type === "income" || query.type === "expense")) {
        filter.type = query.type;
      }
      if (query.categories) {
        filter.categories = query.categories.split(",") as (
          | keyof typeof IncomeCategory
          | keyof typeof ExpenseCategory
        )[];
      }

      const transactions = listTransactions(
        Object.keys(filter).length > 0 ? filter : undefined
      );
      return c.json(transactions);
    } catch (error) {
      return c.json({ error: "Failed to fetch transactions" }, 500);
    }
  })
  .get("/transactions/:accountId", (c) => {
    try {
      const accountId = c.req.param("accountId");
      const query = c.req.query();
      const filter: TransactionFilter = {};

      // Parse query parameters for filtering
      if (query.startDate)
        filter.timeRange = {
          ...filter.timeRange,
          start: parseInt(query.startDate),
        };
      if (query.endDate)
        filter.timeRange = {
          ...filter.timeRange,
          end: parseInt(query.endDate),
        };
      if (query.type && (query.type === "income" || query.type === "expense")) {
        filter.type = query.type;
      }
      if (query.categories) {
        filter.categories = query.categories.split(",") as (
          | keyof typeof IncomeCategory
          | keyof typeof ExpenseCategory
        )[];
      }

      const transactions = listTransactionsForBankAccount(
        accountId,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      if (!transactions) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json(transactions);
    } catch (error) {
      return c.json({ error: "Failed to fetch transactions for account" }, 500);
    }
  })
  .get("/savings-profiles", (c) => {
    try {
      const savingsProfiles = listSavingsProfiles();
      return c.json(savingsProfiles);
    } catch (error) {
      return c.json({ error: "Failed to fetch savings profiles" }, 500);
    }
  })
  .get("/savings-profiles/:profileId", (c) => {
    try {
      const profileId = c.req.param("profileId");
      const profile = listSavingsProfile(profileId);

      if (!profile) {
        return c.json({ error: "Savings profile not found" }, 404);
      }

      return c.json(profile);
    } catch (error) {
      return c.json({ error: "Failed to fetch savings profile" }, 500);
    }
  })
  .post("/savings-profiles", async (c) => {
    try {
      const body: CreateSavingsProfileRequest = await c.req.json();
      const { name, targetAmount, targetDate } = body;

      if (!name || !targetAmount || targetAmount <= 0) {
        return c.json(
          {
            error: "Invalid input: name and positive targetAmount are required",
          },
          400
        );
      }

      const profile = createSavingsProfile({
        name,
        targetAmount,
        targetDate,
      });

      return c.json(profile, 201);
    } catch (error) {
      return c.json({ error: "Failed to create savings profile" }, 500);
    }
  })
  // New savings goals endpoints
  .get("/savings-goals", (c) => {
    try {
      const goals = getAllGoals();
      return c.json(goals);
    } catch (error) {
      return c.json({ error: "Failed to fetch savings goals" }, 500);
    }
  })
  .get("/savings-goals/:goalId", (c) => {
    try {
      const goalId = c.req.param("goalId");
      const goal = getGoalById(goalId);

      if (!goal) {
        return c.json({ error: "Savings goal not found" }, 404);
      }

      return c.json(goal);
    } catch (error) {
      return c.json({ error: "Failed to fetch savings goal" }, 500);
    }
  })
  .post("/savings-goals", async (c) => {
    try {
      const body: CreateSavingsGoalRequest = await c.req.json();
      const {
        name,
        targetAmount,
        currentAmount = 0,
        category,
        targetDate,
        startDate = new Date().toISOString(),
      } = body;

      if (!name || !targetAmount || targetAmount <= 0) {
        return c.json(
          {
            error: "Invalid input: name and positive targetAmount are required",
          },
          400
        );
      }

      const newGoal = createGoal({
        name,
        targetAmount,
        currentAmount,
        category,
        targetDate,
        startDate,
      });

      return c.json(newGoal, 201);
    } catch (error) {
      return c.json({ error: "Failed to create savings goal" }, 500);
    }
  })
  .put("/savings-goals/:goalId", async (c) => {
    try {
      const goalId = c.req.param("goalId");
      const body: Partial<Omit<SavingsProfile, "id">> = await c.req.json();

      const updatedGoal = updateGoal(goalId, body);

      if (!updatedGoal) {
        return c.json({ error: "Savings goal not found" }, 404);
      }

      return c.json(updatedGoal);
    } catch (error) {
      return c.json({ error: "Failed to update savings goal" }, 500);
    }
  })
  .delete("/savings-goals/:goalId", (c) => {
    try {
      const goalId = c.req.param("goalId");
      const success = deleteGoal(goalId);

      if (!success) {
        return c.json({ error: "Savings goal not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Failed to delete savings goal" }, 500);
    }
  })
  // Recurrent Payments endpoints
  .get("/recurrent-payments", (c) => {
    try {
      const recurrentPayments = listRecurrentPayments();
      return c.json(recurrentPayments);
    } catch (error) {
      return c.json({ error: "Failed to fetch recurrent payments" }, 500);
    }
  })
  .get("/recurrent-payments/:paymentId", (c) => {
    try {
      const paymentId = c.req.param("paymentId");
      const payment = getRecurrentPayment(paymentId);

      if (!payment) {
        return c.json({ error: "Recurrent payment not found" }, 404);
      }

      return c.json(payment);
    } catch (error) {
      return c.json({ error: "Failed to fetch recurrent payment" }, 500);
    }
  })
  .get("/bank-accounts/:accountId/recurrent-payments", (c) => {
    try {
      const accountId = c.req.param("accountId");
      const payments = listRecurrentPaymentsByAccount(accountId);

      if (!payments) {
        return c.json({ error: "Account not found" }, 404);
      }

      return c.json(payments);
    } catch (error) {
      return c.json(
        { error: "Failed to fetch recurrent payments for account" },
        500
      );
    }
  })
  .post("/recurrent-payments", async (c) => {
    try {
      const body: CreateRecurrentPaymentRequest = await c.req.json();
      const {
        amount,
        name,
        category,
        frequency,
        startDate,
        endDate,
        autoPay = false,
        savingsProfile,
      } = body;

      if (
        !amount ||
        amount <= 0 ||
        !name ||
        !category ||
        !frequency ||
        !startDate
      ) {
        return c.json(
          {
            error:
              "Invalid input: amount, name, category, frequency, and startDate are required",
          },
          400
        );
      }

      const newPayment = createRecurrentPaymentEntry({
        amount,
        name,
        category,
        frequency,
        startDate,
        endDate,
        autoPay,
        savingsProfile,
      });

      return c.json(newPayment, 201);
    } catch (error) {
      return c.json({ error: "Failed to create recurrent payment" }, 500);
    }
  })
  .put("/recurrent-payments/:paymentId", async (c) => {
    try {
      const paymentId = c.req.param("paymentId");
      const body: Partial<Omit<RecurrentPayment, "id">> = await c.req.json();

      const updatedPayment = updateRecurrentPaymentEntry(paymentId, body);

      if (!updatedPayment) {
        return c.json({ error: "Recurrent payment not found" }, 404);
      }

      return c.json(updatedPayment);
    } catch (error) {
      return c.json({ error: "Failed to update recurrent payment" }, 500);
    }
  })
  .delete("/recurrent-payments/:paymentId", (c) => {
    try {
      const paymentId = c.req.param("paymentId");
      const success = deleteRecurrentPaymentEntry(paymentId);

      if (!success) {
        return c.json({ error: "Recurrent payment not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      return c.json({ error: "Failed to delete recurrent payment" }, 500);
    }
  })
  .post("/receipt-ocr", async (c) => {
    return proxy(`http://${OCR_HOSTNAME}:${OCR_PORT}/receipt-ocr`, c.req);
  });

const app = new Hono()
  .use(
    "/*",
    cors({
      origin: [
        "*",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
      ],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  )
  .route("/api", api)
  .route("/ai", ai_hono)
  .get("/", (c) => c.text("Banking API Server"));

export default app;

// Export only the main app type for RPC client
export type AppRoutes = typeof app;
