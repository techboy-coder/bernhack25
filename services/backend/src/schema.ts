import { z } from "zod";

// Category schema for expense categorization
export const CategorySchema = z.enum([
  "Housing",
  "Transportation",
  "Food",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Savings",
  "Entertainment",
  "Personal",
  "Education",
  "Shopping",
  "Debt",
  "Gifts",
  "Travel",
  "Miscellaneous",
]);

export type Category = z.infer<typeof CategorySchema>;

// Receipt item schema
export const ReceiptItemSchema = z.object({
  name: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  category: CategorySchema,
  ecoScore: z.number().min(0).max(100).optional(),
  healthScore: z.number().min(0).max(100).optional(),
});

export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;

// Receipt schema for tracking purchases
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  merchantName: z.string(),
  items: z.array(ReceiptItemSchema),
  totalAmount: z.number().positive(),
  date: z.string().datetime(),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      address: z.string().optional(),
    })
    .optional(),
  category: CategorySchema,
  paymentMethod: z.string(),
  isRecurring: z.boolean().default(false),
  notes: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

// Monthly budget goal schema
export const BudgetGoalSchema = z.object({
  category: CategorySchema,
  amount: z.number().nonnegative(),
  description: z.string().optional(),
});

export type BudgetGoal = z.infer<typeof BudgetGoalSchema>;

// Recurrent payment/bill schema
export const RecurrentPaymentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  amount: z.number().positive(),
  category: CategorySchema,
  frequency: z.enum([
    "daily",
    "weekly",
    "bi-weekly",
    "monthly",
    "quarterly",
    "yearly",
  ]),
  nextDueDate: z.string().datetime(),
  autoPay: z.boolean().default(false),
  notes: z.string().optional(),
});

export type RecurrentPayment = z.infer<typeof RecurrentPaymentSchema>;

// Savings profile schema
export const SavingsProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  targetDate: z.string().datetime().optional(),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export type SavingsProfile = z.infer<typeof SavingsProfileSchema>;

// Investment schema
export const InvestmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(["stock", "bond", "ETF", "crypto", "real_estate", "other"]),
  purchaseAmount: z.number().positive(),
  currentValue: z.number().nonnegative(),
  purchaseDate: z.string().datetime(),
  notes: z.string().optional(),
  interestCategory: z.array(z.string()).optional(),
});

export type Investment = z.infer<typeof InvestmentSchema>;

// Debt item schema
export const DebtItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  originalAmount: z.number().positive(),
  currentAmount: z.number().nonnegative(),
  interestRate: z.number().nonnegative(),
  minimumPayment: z.number().nonnegative(),
  type: z.enum([
    "credit_card",
    "student_loan",
    "mortgage",
    "car_loan",
    "personal_loan",
    "other",
  ]),
  paymentFrequency: z.enum(["weekly", "bi-weekly", "monthly"]),
  dueDate: z.string().datetime(),
});

export type DebtItem = z.infer<typeof DebtItemSchema>;

// Spending hotspot schema
export const HotspotSchema = z.object({
  id: z.string().uuid(),
  merchantName: z.string(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string(),
  }),
  visitFrequency: z.number().int(),
  averageSpend: z.number().positive(),
  categories: z.array(CategorySchema),
  lastVisited: z.string().datetime(),
});

export type Hotspot = z.infer<typeof HotspotSchema>;

// Anomaly detection schema
export const AnomalySchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  date: z.string().datetime(),
  category: CategorySchema,
  merchantName: z.string(),
  reason: z.string(),
  isResolved: z.boolean().default(false),
  notes: z.string().optional(),
});

export type Anomaly = z.infer<typeof AnomalySchema>;

// Monthly summary schema
export const MonthlySummarySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  totalIncome: z.number().nonnegative(),
  totalExpenses: z.number().nonnegative(),
  savings: z.number(),
  expensesByCategory: z.record(CategorySchema, z.number().nonnegative()),
  goalComparison: z.array(
    z.object({
      category: CategorySchema,
      goal: z.number().nonnegative(),
      actual: z.number().nonnegative(),
      difference: z.number(),
    })
  ),
  savingProgress: z.array(
    z.object({
      profile: z.string().uuid(),
      previousAmount: z.number().nonnegative(),
      currentAmount: z.number().nonnegative(),
      progress: z.number().nonnegative(),
    })
  ),
  netWorthChange: z.number(),
  videos: z.array(z.string().url()).optional(),
});

export type MonthlySummary = z.infer<typeof MonthlySummarySchema>;

// Eco & Health metrics schema
export const EcoHealthMetricsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  co2Footprint: z.number().nonnegative(),
  healthScore: z.number().min(0).max(100),
  foodChoices: z.object({
    sustainable: z.number().nonnegative(),
    organic: z.number().nonnegative(),
    processed: z.number().nonnegative(),
    homeMade: z.number().nonnegative(),
  }),
  recommendations: z.array(z.string()),
});

export type EcoHealthMetrics = z.infer<typeof EcoHealthMetricsSchema>;

// Product comparison schema
export const ProductComparisonSchema = z.object({
  id: z.string().uuid(),
  category: z.string(),
  products: z.array(
    z.object({
      name: z.string(),
      price: z.number().positive(),
      features: z.array(z.string()),
      rating: z.number().min(0).max(5).optional(),
      ecoScore: z.number().min(0).max(100).optional(),
      durability: z.number().min(0).max(100).optional(),
      valueForMoney: z.number().min(0).max(100).optional(),
    })
  ),
  preferredOption: z.string().optional(),
  notes: z.string().optional(),
});

export type ProductComparison = z.infer<typeof ProductComparisonSchema>;

// Random stats schema for quirky opening stats
export const RandomStatsSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  value: z.union([z.string(), z.number()]),
  date: z.string().datetime(),
});

export type RandomStats = z.infer<typeof RandomStatsSchema>;

// User profile schema for the single user
export const UserProfileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  monthlyIncome: z.number().nonnegative(),
  savingGoalPercentage: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// Master database schema - adjusted for single user
export const MasterDBSchema = z.object({
  userProfile: UserProfileSchema,
  receipts: z.array(ReceiptSchema),
  recurrentPayments: z.array(RecurrentPaymentSchema),
  budgetGoals: z.record(z.string(), z.array(BudgetGoalSchema)), // year-month -> goals
  savingsProfiles: z.array(SavingsProfileSchema),
  investments: z.array(InvestmentSchema),
  debts: z.array(DebtItemSchema),
  hotspots: z.array(HotspotSchema),
  anomalies: z.array(AnomalySchema),
  monthlySummaries: z.array(MonthlySummarySchema),
  ecoHealthMetrics: z.array(EcoHealthMetricsSchema),
  productComparisons: z.array(ProductComparisonSchema),
  randomStats: z.array(RandomStatsSchema),
});

export type MasterDB = z.infer<typeof MasterDBSchema>;

// Helper function to validate JSON against the MasterDBSchema
export const validateMasterDB = (json: unknown): MasterDB => {
  return MasterDBSchema.parse(json);
};
