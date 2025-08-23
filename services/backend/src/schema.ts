import { z } from "zod";

// Basic schema types
const UUIDSchema = z.union([
    z.string().uuid(),
    z.string()
        .regex(new RegExp("^https://static.rwpz.net/spendcast/.*$")),
]);
const DateSchema = z.string().datetime();
const CoordinatesSchema = z.object({
  latitude: z.number().min(45.8).max(47.8), // Switzerland latitude range
  longitude: z.number().min(5.9).max(10.5), // Switzerland longitude range
});

// Category enums
export const ExpenseCategory = {
  FOOD: "food",
  GROCERIES: "groceries",
  TRANSPORT: "transport",
  HOUSING: "housing",
  UTILITIES: "utilities",
  HEALTHCARE: "healthcare",
  ENTERTAINMENT: "entertainment",
  EDUCATION: "education",
  SHOPPING: "shopping",
  TRAVEL: "travel",
  OTHER: "other",
} as const;

export const IncomeCategory = {
  SALARY: "salary",
  FREELANCE: "freelance",
  INVESTMENTS: "investments",
  GIFTS: "gifts",
  REFUNDS: "refunds",
  INITIAL_DEPOSIT: "initial_deposit", // For recording initial account balances
  OTHER: "other",
} as const;

export const AccountType = {
  PERSONAL: "personal",
  SAVINGS: "savings",
  RETIREMENT: "retirement",
  MARRIAGE: "marriage",
} as const;

// Receipt schema - contains details about what was purchased/received
export const ReceiptSchema = z.object({
  id: UUIDSchema,
  description: z.string(),
  merchant: z.string(),
  location: CoordinatesSchema, // Always has location for geo-tracking
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

// Transaction schema - the actual bank transaction
export const TransactionSchema = z.object({
  id: UUIDSchema,
  amount: z.number(), // Positive for income, negative for expenses
  date: DateSchema,
  category: z.union([
    z.nativeEnum(IncomeCategory),
    z.nativeEnum(ExpenseCategory),
  ]),
  receiptId: UUIDSchema.optional(), // References a receipt if there is one
  recurrentPaymentId: UUIDSchema.optional(), // References a ruccerent payment if this transaction was triggered by one
  balance: z.number(), // Account balance after this transaction
});

// Recurrent payment schema - setup per account
export const RecurrentPaymentSchema = z.object({
  id: UUIDSchema,
  amount: z.number().positive(),
  name: z.string(),
  category: z.nativeEnum(ExpenseCategory), // Recurrent payments are typically expenses
  frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: DateSchema,
  endDate: DateSchema.optional(),
  autoPay: z.boolean().default(false),
  savingsProfile: UUIDSchema.optional()
});

// Bank account schema - contains transactions and recurrent payments
export const BankAccountSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  type: z.nativeEnum(AccountType),
  currentBalance: z.number(),
  currency: z.string().default("CHF"),
  transactions: z.array(TransactionSchema),
  recurrentPayments: z.array(RecurrentPaymentSchema),
});

// Savings profile schema - separate from bank accounts
export const SavingsProfileSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  currentAmount: z.number().nonnegative(),
  targetAmount: z.number().positive(),
  startDate: DateSchema,
  targetDate: DateSchema.optional(),
  category: z.string(),
});

// Main database schema
export const DbSchema = z.object({
  bankAccounts: z.array(BankAccountSchema),
  receipts: z.array(ReceiptSchema),
  savingsProfiles: z.array(SavingsProfileSchema),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type RecurrentPayment = z.infer<typeof RecurrentPaymentSchema>;
export type BankAccount = z.infer<typeof BankAccountSchema>;
export type SavingsProfile = z.infer<typeof SavingsProfileSchema>;
export type Database = z.infer<typeof DbSchema>;
