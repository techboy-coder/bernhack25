import { getData } from "../src/getData";
import type { BankAccount } from "../src/schema";

/**
 * Simplified bank account summary for listing purposes
 */
export interface BankAccountSummary {
  id: string;
  name: string;
  type: "personal" | "savings";
  currentBalance: number;
  currency: string;
  transactionCount: number;
  recurrentPaymentCount: number;
  lastTransactionDate?: string;
  monthlyExpenseTotal?: number;
  monthlyIncomeTotal?: number;
}

/**
 * Returns a list of bank accounts with essential details
 * Omits full transaction arrays for performance and simplified response
 */
export function listBankAccounts(): BankAccountSummary[] {
  const database = getData();

  return database.bankAccounts.map(
    (account: BankAccount): BankAccountSummary => {
      // Calculate transaction statistics
      const transactions = account.transactions;
      const transactionCount = transactions.length;

      // Find the most recent transaction
      const lastTransaction =
        transactions.length > 0
          ? transactions.reduce((latest, current) =>
              new Date(current.date) > new Date(latest.date) ? current : latest
            )
          : null;

      // Calculate monthly totals (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentTransactions = transactions.filter(
        (t) => new Date(t.date) >= thirtyDaysAgo
      );

      const monthlyExpenses = recentTransactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const monthlyIncome = recentTransactions
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        currentBalance: account.currentBalance,
        currency: account.currency,
        transactionCount,
        recurrentPaymentCount: account.recurrentPayments.length,
        lastTransactionDate: lastTransaction?.date,
        monthlyExpenseTotal: monthlyExpenses > 0 ? monthlyExpenses : undefined,
        monthlyIncomeTotal: monthlyIncome > 0 ? monthlyIncome : undefined,
      };
    }
  );
}
