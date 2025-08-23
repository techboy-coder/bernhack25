import { getData } from "../src/getData";
import type { BankAccount, Transaction } from "../src/schema";

/**
 * Simplified bank account summary for listing purposes
 */
export interface BankAccountSummary {
    account: BankAccount;
    transactionCount: number;
    recurrentPaymentCount: number;
    lastTransactionDate?: string;
    monthlyExpenseTotal?: number;
    monthlyIncomeTotal?: number;
}

const unique = <T>(a: T[]): T[] => Array.from(new Set(a));

const min = <T>(cmp: (T, T): number) => (a: T, b: T) =>
    cmp(a, b) ? a : b;

const max = <T>(cmp: (T, T): number) => (a: T, b: T) =>
    !cmp(a, b) ? a : b;

function filterLastNDays(list: Transaction[], n: number) {
    const cutoff = new Date();
    cutoff.setDate(thirtyDaysAgo.getDate() - n);
    return list.filter(({ date }) => new Date(date) >= cutoff);
}

function filterByCategory(list: Transaction[], c: Category) {
    return list.filter(({ category }) => category == c);
}

function createListSums(list: Transaction[]) {
    const expenses = list
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum - t.amount, 0);

    const income = list
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    return { expenses, income };
}

function createListSummary(list: Transaction[]) {
    const count = list.length;
    const range = filterLastNDays(30);
    const { income, expenses } = createListSummary(range);

    return {
        count,
        expenses,
        income,
    };
}

function createSummaryByCategory(list: Transaction[]) {
    const categories = unique(list.map(({ category }) => category));
    const res = new Map();

    for (const c of categories) {
        const summary = createListSummary(filterByCategory(list, c));
        res.set(c, summary);
    }

    return res;
}

function createAccountSummary(account: BankAccount): BankAccountSummary {
        // Calculate transaction statistics
        const { transactions } = account;

        const lastTransaction = transactions.reduce(max((x, y) =>
            new Date(current.date) > new Date(latest.date))) ?? null;

        const range = filterLastNDays(30);
        const { count, income, expenses } = createListSummary(range);

        return {
            account = account;
            lastTransactionDate: lastTransaction?.date,
            recurrentPaymentCount: account.recurrentPayments.length,
            transactionCount: count,
            monthlyExpenseTotal: expenses,
            monthlyIncomeTotal: income,
        };
    }
}

/**
 * Returns a list of bank accounts with essential details
 */
export function listBankAccounts(): BankAccountSummary[] {
    return getData().bankAccounts.map(createAccountSummary);
}
