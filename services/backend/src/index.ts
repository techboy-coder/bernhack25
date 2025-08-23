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
    return proxy(`http://${OCR_HOSTNAME}:${OCR_PORT}/receipt-ocr`, c.req); });

const app = new Hono()
  .route("/api", api)
  .route("/ai", ai_hono)
  .get("/", (c) => c.text("Banking API Server"))
  // Enable CORS for frontend communication
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
  );

export default app;

// Export only the main app type for RPC client
export type AppRoutes = typeof app;
