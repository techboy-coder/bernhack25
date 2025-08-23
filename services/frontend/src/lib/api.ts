import { hc } from 'hono/client';
import type { ApiRoutes } from '../../../backend/src/index';
import type { SavingsProfile, RecurrentPayment } from '../../../backend/src/schema';

// Define transaction filter type based on backend implementation
interface TransactionFilter {
	timeRange?: {
		start?: number;
		end?: number;
	};
	type?: 'income' | 'expense';
	categories?: string[];
}

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

// Convenience function to get all savings profiles
export const getSavingsProfiles = async (): Promise<SavingsProfile[]> => {
	const response = await api['savings-profiles'].$get();
	if (!response.ok) {
		throw new Error('Failed to fetch savings profiles');
	}
	return await response.json();
};

// Convenience function to get a specific savings profile by ID
export const getSavingsProfile = async (profileId: string): Promise<SavingsProfile> => {
	const response = await api['savings-profiles'][':profileId'].$get({
		param: { profileId }
	});
	if (!response.ok) {
		throw new Error('Failed to fetch savings profile');
	}
	return await response.json();
};

// Convenience function to create a new savings profile
export const createSavingsProfile = async (profileData: {
	name: string;
	targetAmount: number;
	targetDate?: number;
}): Promise<SavingsProfile> => {
	const response = await api['savings-profiles'].$post({
		json: profileData
	});
	if (!response.ok) {
		throw new Error('Failed to create savings profile');
	}
	return await response.json();
};

// Savings Goals API Functions

// Get all savings goals
export const getSavingsGoals = async (): Promise<SavingsProfile[]> => {
	const response = await api['savings-goals'].$get();
	if (!response.ok) {
		throw new Error('Failed to fetch savings goals');
	}
	return await response.json();
};

// Get a specific savings goal by ID
export const getSavingsGoal = async (goalId: string): Promise<SavingsProfile> => {
	const response = await api['savings-goals'][':goalId'].$get({
		param: { goalId }
	});
	if (!response.ok) {
		throw new Error('Failed to fetch savings goal');
	}
	return await response.json();
};

// Create a new savings goal
export const createSavingsGoal = async (goalData: {
	name: string;
	targetAmount: number;
	currentAmount?: number;
	category: string;
	targetDate?: string;
	startDate?: string;
}): Promise<SavingsProfile> => {
	const response = await api['savings-goals'].$post({
		json: goalData
	});
	if (!response.ok) {
		throw new Error('Failed to create savings goal');
	}
	return await response.json();
};

// Update an existing savings goal
export const updateSavingsGoal = async (
	goalId: string,
	updatedData: Partial<Omit<SavingsProfile, 'id'>>
): Promise<SavingsProfile> => {
	const response = await (api['savings-goals'][':goalId'] as any).$put({
		param: { goalId },
		json: updatedData
	});
	if (!response.ok) {
		throw new Error('Failed to update savings goal');
	}
	return await response.json();
};

// Delete a savings goal
export const deleteSavingsGoal = async (goalId: string): Promise<{ success: boolean }> => {
	const response = await api['savings-goals'][':goalId'].$delete({
		param: { goalId }
	});
	if (!response.ok) {
		throw new Error('Failed to delete savings goal');
	}
	return await response.json();
};

// Recurrent Payments API Functions

// Get all recurrent payments
export const getRecurrentPayments = async (): Promise<RecurrentPayment[]> => {
	const response = await api['recurrent-payments'].$get();
	if (!response.ok) {
		throw new Error('Failed to fetch recurrent payments');
	}
	return await response.json();
};

// Get a specific recurrent payment by ID
export const getRecurrentPayment = async (paymentId: string): Promise<RecurrentPayment> => {
	const response = await api['recurrent-payments'][':paymentId'].$get({
		param: { paymentId }
	});
	if (!response.ok) {
		throw new Error('Failed to fetch recurrent payment');
	}
	return await response.json();
};

// Get recurrent payments for a specific account
export const getRecurrentPaymentsByAccount = async (
	accountId: string
): Promise<RecurrentPayment[]> => {
	const response = await api['bank-accounts'][':accountId']['recurrent-payments'].$get({
		param: { accountId }
	});
	if (!response.ok) {
		throw new Error('Failed to fetch recurrent payments for account');
	}
	return await response.json();
};

// Create a new recurrent payment
export const createRecurrentPayment = async (paymentData: {
	amount: number;
	name: string;
	category: string;
	frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
	startDate: string;
	endDate?: string;
	autoPay?: boolean;
	savingsProfile?: string;
}): Promise<RecurrentPayment> => {
	const response = await api['recurrent-payments'].$post({
		json: paymentData
	});
	if (!response.ok) {
		throw new Error('Failed to create recurrent payment');
	}
	return await response.json();
};

// Update an existing recurrent payment
export const updateRecurrentPayment = async (
	paymentId: string,
	updatedData: Partial<Omit<RecurrentPayment, 'id'>>
): Promise<RecurrentPayment> => {
	const response = await (api['recurrent-payments'][':paymentId'] as any).$put({
		param: { paymentId },
		json: updatedData
	});
	if (!response.ok) {
		throw new Error('Failed to update recurrent payment');
	}
	return await response.json();
};

// Delete a recurrent payment
export const deleteRecurrentPayment = async (paymentId: string): Promise<{ success: boolean }> => {
	const response = await api['recurrent-payments'][':paymentId'].$delete({
		param: { paymentId }
	});
	if (!response.ok) {
		throw new Error('Failed to delete recurrent payment');
	}
	return await response.json();
};
