import { getData } from "../src/getData";
import type { BankAccount, Transaction, IncomeCategory, ExpenseCategory } from "../src/schema";

/**
 * Simplified bank account info for listing (excludes transactions array)
 */
export interface AccountInfo {
  id: string;
  name: string;
  type: "personal" | "savings" | "retirement" | "marriage";
  currentBalance: number;
  currency: string;
}

/**
 * Bank account summary with key statistics for the accounts listing page
 */
export interface BankAccountSummary {
  account: AccountInfo;
  transactionCount: number;
  lastTransactionDate?: string;
  monthlyExpenseTotal: number;
  monthlyIncomeTotal: number;
}

function filterLastNDays(list: Transaction[], n: number): Transaction[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  return list.filter(({ date }) => new Date(date) >= cutoff);
}

function createAccountSummary(account: BankAccount): BankAccountSummary {
  const { transactions } = account;

  // Find most recent transaction
  const lastTransaction =
    transactions.length > 0
      ? transactions.reduce((latest, current) =>
          new Date(current.date) > new Date(latest.date) ? current : latest
        )
      : null;

  // Calculate last 30 days statistics
  const recentTransactions = filterLastNDays(transactions, 30);
  const monthlyExpenseTotal = recentTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthlyIncomeTotal = recentTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // Return minimal account info without heavy data
  return {
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      currentBalance: account.currentBalance,
      currency: account.currency,
    },
    transactionCount: transactions.length,
    lastTransactionDate: lastTransaction?.date,
    monthlyExpenseTotal,
    monthlyIncomeTotal,
  };
}

/**
 * Returns bank accounts with essential details for the accounts listing page.
 * Excludes transaction arrays to minimize response size.
 *
 * @returns Array of bank account summaries with:
 *   - Basic account info (id, name, type, balance, currency)
 *   - Transaction count
 *   - Last transaction date
 *   - Monthly income/expense totals (last 30 days)
 */
export function listBankAccounts(): BankAccountSummary[] {
  return getData().bankAccounts.map(createAccountSummary);
}

type TransactionFilter = {
    timeRange?: {
        start?: number,
        end?: number
    },
    type?: 'income' | 'expense',
    categories?: (keyof typeof IncomeCategory | keyof typeof ExpenseCategory)[],
}

export function listTransactions(filter?: TransactionFilter) {
    let transactions = getData().bankAccounts.flatMap(account => account.transactions)
    
    if(filter) transactions = transactions.filter(transaction => {
        if(filter.timeRange?.start && new Date(transaction.date) < new Date(filter.timeRange?.start)) return false
        if(filter.timeRange?.end && new Date(transaction.date) > new Date(filter.timeRange?.end)) return false

        if(filter.type) {
            if(filter.type === 'income' && transaction.amount < 0) return false
            else if(filter.type === 'expense' && transaction.amount > 0) return false
        }

        if(filter.categories && !(transaction.category in filter.categories)) return false

        return true
    })

    return transactions
}