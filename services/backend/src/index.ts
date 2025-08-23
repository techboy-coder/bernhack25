import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  listBankAccounts,
  listTransactions,
  listTransactionsForBankAccount,
  listSavingsProfiles,
  listSavingsProfile,
  createSavingsProfile,
} from "../func";
import {
  getAllGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  type SavingsGoal,
} from "./goalsData";
import type { IncomeCategory, ExpenseCategory } from "./schema";

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

const app = new Hono();

// Enable CORS for frontend communication
app.use(
  "/*",
  cors({
    origin: ["*", "http://localhost:3000", "http://localhost:5173"],
    allowHeaders: ["Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.get("/", (c) => c.text("Banking API Server"));

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
      const body: Partial<Omit<SavingsGoal, "id">> = await c.req.json();

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
  });

app.route("/api", api);

export default app;
export type ApiRoutes = typeof api;
