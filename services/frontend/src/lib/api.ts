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
