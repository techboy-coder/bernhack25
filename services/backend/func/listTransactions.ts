import { getData } from "../src/getData";
import type { IncomeCategory, ExpenseCategory, Transaction } from "../src/schema";

type TransactionFilter = {
  timeRange?: {
      start?: number,
      end?: number
  },
  type?: 'income' | 'expense',
  categories?: (keyof typeof IncomeCategory | keyof typeof ExpenseCategory)[],
}

function applyFilter(transactions: Transaction[], filter?: TransactionFilter) {
  if(!filter) return transactions

  return transactions.filter(transaction => {
    if(filter.timeRange?.start && new Date(transaction.date) < new Date(filter.timeRange?.start)) return false
    if(filter.timeRange?.end && new Date(transaction.date) > new Date(filter.timeRange?.end)) return false

    if(filter.type) {
        if(filter.type === 'income' && transaction.amount < 0) return false
        else if(filter.type === 'expense' && transaction.amount > 0) return false
    }

    if(filter.categories && !(transaction.category in filter.categories)) return false

    return true
  })
}

export function listTransactions(filter?: TransactionFilter) {
  return applyFilter(getData().bankAccounts.flatMap(account => account.transactions), filter)
}

export function listTransactionsForBankAccount(accountId: string, filter?: TransactionFilter) {
  let transactions = getData().bankAccounts.find(account => account.id === accountId)?.transactions
  if(!transactions) return
  
  return applyFilter(transactions, filter)
}