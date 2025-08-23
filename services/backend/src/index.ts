import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  listBankAccounts,
  listTransactions,
  listTransactionsForBankAccount,
} from "../func";

const app = new Hono();

// Enable CORS for frontend communication
app.use(
  "/*",
  cors({
    origin: ["*"],
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
      const filter: any = {};

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
      if (query.type) filter.type = query.type;
      if (query.categories) filter.categories = query.categories.split(",");

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
      const filter: any = {};

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
      if (query.type) filter.type = query.type;
      if (query.categories) filter.categories = query.categories.split(",");

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
  });

app.route("/api", api);

export default app;
export type ApiRoutes = typeof api;
