import { getData } from "../src/getData";
import type { IncomeCategory, ExpenseCategory } from "../src/schema";

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