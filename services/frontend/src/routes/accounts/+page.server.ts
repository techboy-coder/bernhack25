import { getBankAccounts } from '../../lib/api.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	try {
		const bankAccounts = await getBankAccounts();
		return {
			bankAccounts
		};
	} catch (error) {
		console.error('Failed to load bank accounts:', error);

		// Check if it's a network error
		const isNetworkError =
			error instanceof Error &&
			(error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED'));
		const errorMessage = isNetworkError
			? 'Unable to connect to the backend server. Please ensure the backend is running on http://localhost:3000'
			: `Failed to load bank accounts: ${error instanceof Error ? error.message : 'Unknown error'}`;

		return {
			bankAccounts: [],
			error: errorMessage
		};
	}
};
