import { getBankAccounts, getTransactions, getSavingsProfiles } from '../../lib/api.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all the data needed for the wrapped presentation
		const [bankAccounts, transactions, savingsProfiles] = await Promise.all([
			getBankAccounts(),
			getTransactions(),
			getSavingsProfiles()
		]);

		// Process data to calculate wrapped insights
		const currentYear = new Date().getFullYear();
		const yearStart = new Date(currentYear, 0, 1);

		// Filter transactions for current year
		const yearTransactions = transactions.filter((t: any) => new Date(t.date) >= yearStart);

		// Calculate total spending and earning
		const totalSpent = yearTransactions
			.filter((t: any) => t.amount < 0)
			.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

		const totalEarned = yearTransactions
			.filter((t: any) => t.amount > 0)
			.reduce((sum: number, t: any) => sum + t.amount, 0);

		// Calculate category spending
		const categorySpending: Record<string, number> = {};
		yearTransactions
			.filter((t: any) => t.amount < 0)
			.forEach((t: any) => {
				categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
			});

		// Find top category
		const topCategory = Object.entries(categorySpending).sort(
			([, a], [, b]) => (b as number) - (a as number)
		)[0];

		// Calculate monthly spending
		const monthlySpending = Array.from({ length: 12 }, (_, i) => {
			const monthTransactions = yearTransactions.filter((t: any) => {
				const date = new Date(t.date);
				return date.getMonth() === i && t.amount < 0;
			});
			return monthTransactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
		});

		// Find biggest spending month
		const biggestMonthIndex = monthlySpending.indexOf(Math.max(...monthlySpending));
		const biggestMonth = {
			month: new Date(currentYear, biggestMonthIndex, 1).toLocaleString('default', {
				month: 'long'
			}),
			amount: monthlySpending[biggestMonthIndex]
		};

		// Find biggest single purchase
		const biggestSpend = yearTransactions
			.filter((t: any) => t.amount < 0)
			.sort((a: any, b: any) => a.amount - b.amount)[0];

		return {
			accounts: bankAccounts,
			savingsProfiles,
			totalSpent,
			totalEarned,
			totalTransactions: yearTransactions.length,
			topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
			biggestMonth,
			biggestSpend,
			monthlySpending,
			categorySpending
		};
	} catch (error) {
		console.error('Failed to load wrapped data:', error);

		// Return empty data structure so slides can still show with fallbacks
		return {
			accounts: [],
			savingsProfiles: [],
			totalSpent: 0,
			totalEarned: 0,
			totalTransactions: 0,
			topCategory: null,
			biggestMonth: { month: 'January', amount: 0 },
			biggestSpend: null,
			monthlySpending: Array(12).fill(0),
			categorySpending: {},
			error: 'Failed to load financial data'
		};
	}
};
