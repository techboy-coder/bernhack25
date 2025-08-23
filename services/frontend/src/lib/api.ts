import { hc } from 'hono/client';
import type { ApiRoutes } from '../../../backend/src/index';

// Create the RPC client pointing to the backend server
const client = hc<ApiRoutes>('http://localhost:3000/api');

export const api = client;

// Convenience function to get bank accounts
export const getBankAccounts = async () => {
	const response = await api['bank-accounts'].$get();
	if (!response.ok) {
		throw new Error('Failed to fetch bank accounts');
	}
	return await response.json();
};

// Convenience function to get all transactions with optional filters
export const getTransactions = async (filters?: {
	startDate?: number;
	endDate?: number;
	type?: 'income' | 'expense';
	categories?: string[];
}) => {
	const query: Record<string, string> = {};

	if (filters?.startDate) query.startDate = filters.startDate.toString();
	if (filters?.endDate) query.endDate = filters.endDate.toString();
	if (filters?.type) query.type = filters.type;
	if (filters?.categories) query.categories = filters.categories.join(',');

	const response = await api.transactions.$get({ query });
	if (!response.ok) {
		throw new Error('Failed to fetch transactions');
	}
	return await response.json();
};

// Convenience function to get transactions for a specific account with optional filters
export const getTransactionsForAccount = async (
	accountId: string,
	filters?: {
		startDate?: number;
		endDate?: number;
		type?: 'income' | 'expense';
		categories?: string[];
	}
) => {
	const query: Record<string, string> = {};

	if (filters?.startDate) query.startDate = filters.startDate.toString();
	if (filters?.endDate) query.endDate = filters.endDate.toString();
	if (filters?.type) query.type = filters.type;
	if (filters?.categories) query.categories = filters.categories.join(',');

	const response = await api.transactions[':accountId'].$get({
		param: { accountId },
		...(Object.keys(query).length > 0 && { query })
	});
	if (!response.ok) {
		throw new Error('Failed to fetch transactions for account');
	}
	return await response.json();
};
