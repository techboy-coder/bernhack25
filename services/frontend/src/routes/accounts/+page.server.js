import { getBankAccounts } from '../../lib/api.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	try {
		let bankAccounts = await getBankAccounts();
		return {
			bankAccounts
		};
	} catch (error) {
		console.error('Failed to load bank accounts:', error);
		return {
			bankAccounts: [],
			error: 'Failed to load bank accounts'
		};
	}
}
