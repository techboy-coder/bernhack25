import { getData } from "../src/getData";
import { getAllRecurrentPayments } from "../src/recurrentPaymentData";

export function listRecurrentPayments() {
  return getData().bankAccounts.flatMap(account => account.recurrentPayments).concat(getAllRecurrentPayments())
}

export function listRecurrentPaymentsByAccount(accountId: string) {
  const account = getData().bankAccounts.find(account => account.id === accountId)
  if(!account) return

  return account.recurrentPayments
}