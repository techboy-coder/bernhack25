import { getTransactionsForAccount, getBankAccounts } from '../../../../lib/api.js';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const { accountId } = params;

	try {
		// Get all bank accounts to find the specific account details
		const bankAccounts = await getBankAccounts();
		const account = bankAccounts.find((acc) => acc.account.id === accountId);

		if (!account) {
			throw error(404, 'Account not found');
		}

		// Get transactions for this specific account
		const transactions = await getTransactionsForAccount(accountId);

		return {
			account,
			transactions,
			accountId
		};
	} catch (err) {
		console.error('Failed to load account transactions:', err);
		if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
			throw err;
		}
		throw error(500, 'Failed to load account transactions');
	}
}
