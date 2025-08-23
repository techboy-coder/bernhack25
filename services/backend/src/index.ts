import { Hono } from "hono";
import { cors } from "hono/cors";
import { listBankAccounts } from "../func";

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
const api = new Hono().get("/bank-accounts", (c) => {
  try {
    const bankAccounts = listBankAccounts();
    return c.json(bankAccounts);
  } catch (error) {
    return c.json({ error: "Failed to fetch bank accounts" }, 500);
  }
});

app.route("/api", api);

export default app;
export type ApiRoutes = typeof api;
