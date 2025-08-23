import { getData } from "../src/getData";
import {
  getAllRecurrentPayments,
  createRecurrentPayment,
  getRecurrentPaymentById,
  updateRecurrentPayment,
  deleteRecurrentPayment,
} from "../src/recurrentPaymentData";
import type { RecurrentPayment } from "../src/schema";
import fs from "fs";
import path from "path";

export function listRecurrentPayments() {
  return getData()
    .bankAccounts.flatMap((account) => account.recurrentPayments)
    .concat(getAllRecurrentPayments());
}

export function listRecurrentPaymentsByAccount(accountId: string) {
  const account = getData().bankAccounts.find(
    (account) => account.id === accountId
  );
  if (!account) return;

  return account.recurrentPayments;
}

// CRUD operations for standalone recurrent payments
export function createRecurrentPaymentEntry(
  data: Omit<RecurrentPayment, "id">
) {
  return createRecurrentPayment(data);
}

export function getRecurrentPayment(id: string) {
  // First check standalone payments
  const standalonePayment = getRecurrentPaymentById(id);
  if (standalonePayment) {
    return standalonePayment;
  }

  // Then check account-specific payments
  const data = getData();
  for (const account of data.bankAccounts) {
    const payment = account.recurrentPayments.find((p) => p.id === id);
    if (payment) {
      return payment;
    }
  }

  return undefined;
}

export function updateRecurrentPaymentEntry(
  id: string,
  updateData: Partial<Omit<RecurrentPayment, "id">>
) {
  // First try to update standalone payment
  const standaloneUpdated = updateRecurrentPayment(id, updateData);
  if (standaloneUpdated) {
    return standaloneUpdated;
  }

  // Then try to update account-specific payment
  const data = getData();
  for (const account of data.bankAccounts) {
    const paymentIndex = account.recurrentPayments.findIndex(
      (p) => p.id === id
    );
    if (paymentIndex !== -1) {
      // Update the payment
      account.recurrentPayments[paymentIndex] = {
        ...account.recurrentPayments[paymentIndex],
        ...updateData,
      };

      // Write back to the database
      const dbPath = path.join(__dirname, "../db/db.json");
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

      return account.recurrentPayments[paymentIndex];
    }
  }

  return undefined;
}

export function deleteRecurrentPaymentEntry(id: string) {
  // First try to delete standalone payment
  const standaloneDeleted = deleteRecurrentPayment(id);
  if (standaloneDeleted) {
    return true;
  }

  // Then try to delete account-specific payment
  const data = getData();
  for (const account of data.bankAccounts) {
    const paymentIndex = account.recurrentPayments.findIndex(
      (p) => p.id === id
    );
    if (paymentIndex !== -1) {
      // Remove the payment
      account.recurrentPayments.splice(paymentIndex, 1);

      // Write back to the database
      const dbPath = path.join(__dirname, "../db/db.json");
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

      return true;
    }
  }

  return false;
}
