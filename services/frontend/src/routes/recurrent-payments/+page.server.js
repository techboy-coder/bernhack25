import { getRecurrentPayments, getBankAccounts } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		const [recurrentPayments, bankAccounts] = await Promise.all([
			getRecurrentPayments(),
			getBankAccounts()
		]);

		return {
			recurrentPayments,
			bankAccounts
		};
	} catch (error) {
		console.error('Failed to load recurrent payments data:', error);
		return {
			recurrentPayments: [],
			bankAccounts: [],
			error: 'Failed to load recurrent payments data'
		};
	}
}
