import { getData } from "../src/getData";
import type { IncomeCategory, ExpenseCategory, Transaction, RecurrentPayment } from "../src/schema";
import { DateTime } from 'luxon'

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

function getNextRecurrentPaymentDate(recurrentPayment: RecurrentPayment, after?: number) {
  const afterDateTime = after ? DateTime.fromSeconds(after / 1000) : DateTime.now()

  let result = DateTime.fromISO(recurrentPayment.startDate)
  if(recurrentPayment.frequency === 'monthly') {
    result.set({ month: afterDateTime.month, year: afterDateTime.year })

    if(result < afterDateTime) result.plus({ month: 1 })
  } else if(recurrentPayment.frequency === 'quarterly') {
    const quarterOffset = result.month % 3
    const afterQuarter = Math.floor((afterDateTime.month - quarterOffset + 3) / 3) * 3

    result.set({ month: quarterOffset + afterQuarter, year: afterDateTime.year })

    if(result < afterDateTime) result.plus({ month: 3 })
  } else if(recurrentPayment.frequency === 'weekly') {
    result.set({ weekYear: afterDateTime.weekYear, year: afterDateTime.year })

    if(result < afterDateTime) result.plus({ week: 1 })
  } else if(recurrentPayment.frequency === 'yearly') {
    result.set({ year: afterDateTime.year })

    if(result < afterDateTime) result.plus({ year: 1 })
  } else throw 'invalid frequency'

  return result.toUnixInteger() * 1000
}

export function projectTransactionsForBankAccount(accountId: string, filter: TransactionFilter & { timeRange: {
  start: number,
  end: number
} }) {
  let account = getData().bankAccounts.find(account => account.id === accountId)
  if(!account) return

  const transactions = listTransactionsForBankAccount(accountId, filter)
  if(!transactions) return

  type OutstandingRecurrentPayment = {
    recurrentPaymentId: string,
    date: number
  }

  const recurrentTransactionMap: { [key: string]: Transaction[] } = {}
  for(const transaction of transactions) {
    if(transaction.recurrentPaymentId) {
      if(recurrentTransactionMap[transaction.id] === undefined) recurrentTransactionMap[transaction.id] = []

      recurrentTransactionMap[transaction.id].push(transaction)
    }
  }

  const outstandingRecurrentPayments: OutstandingRecurrentPayment[] = []
  for(const recurrentPayment of account.recurrentPayments) {
    const alreadyMadeTransactions = recurrentTransactionMap[recurrentPayment.id] ?? []

    let date = getNextRecurrentPaymentDate(recurrentPayment, filter.timeRange.start)
    while(date < filter.timeRange.end) {
      const hasTransaction = alreadyMadeTransactions.find(transaction => new Date(transaction.date).getTime() == date) !== undefined

      if(!hasTransaction) outstandingRecurrentPayments.push({
        recurrentPaymentId: recurrentPayment.id,
        date: date
      })

      date = getNextRecurrentPaymentDate(recurrentPayment, date)
    }
  }

  return outstandingRecurrentPayments
}