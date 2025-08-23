import { getTransactions } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		// We only need basic transaction data for error handling
		// Savings goals will be loaded client-side with TanStack Query
		const transactions = await getTransactions();

		return {
			transactions
		};
	} catch (error) {
		console.error('Failed to load data:', error);
		return {
			transactions: [],
			error: 'Failed to load data'
		};
	}
}
