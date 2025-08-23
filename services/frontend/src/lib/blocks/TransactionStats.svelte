<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		receiptId?: string;
		balance: number;
	}

	interface TransactionStatsProps {
		transactions: Transaction[];
		accountCurrency?: string;
	}

	let { transactions, accountCurrency = 'CHF' }: TransactionStatsProps = $props();

	// Calculate statistics
	let totalTransactions = $derived(transactions.length);
	let incomeTransactions = $derived(transactions.filter((t) => t.amount > 0));
	let expenseTransactions = $derived(transactions.filter((t) => t.amount < 0));

	let totalIncome = $derived(incomeTransactions.reduce((sum, t) => sum + t.amount, 0));
	let totalExpenses = $derived(Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0)));
	let netTransactionAmount = $derived(totalIncome - totalExpenses);

	// Get the most recent balance (current account balance)
	let currentBalance = $derived(
		transactions.length > 0
			? transactions.reduce((latest, current) =>
					new Date(current.date) > new Date(latest.date) ? current : latest
				).balance
			: 0
	);

	// Helper function to format currency
	function formatCurrency(amount: number, currency: string = 'CHF'): string {
		const isNegative = amount < 0;
		const absAmount = Math.abs(amount);
		const formatted = new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(absAmount);
		return isNegative ? `-${formatted}` : formatted;
	}

	// Helper function to get balance color class
	function getBalanceColorClass(balance: number): string {
		if (balance > 0) return 'text-green-600 dark:text-green-400';
		if (balance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}
</script>

<!-- Transaction Statistics Cards -->
<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
	<!-- Total Transactions -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Transactions</CardTitle>
			<div class="text-2xl">📊</div>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
			<p class="text-xs text-muted-foreground">
				{incomeTransactions.length} income, {expenseTransactions.length} expenses
			</p>
		</CardContent>
	</Card>

	<!-- Total Income -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Income (All Time)</CardTitle>
			<div class="text-2xl">💰</div>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-green-600 dark:text-green-400">
				{formatCurrency(totalIncome, accountCurrency)}
			</div>
			<p class="text-xs text-muted-foreground">
				{incomeTransactions.length} transactions (account lifetime)
			</p>
		</CardContent>
	</Card>

	<!-- Total Expenses -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Expenses (All Time)</CardTitle>
			<div class="text-2xl">💸</div>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-red-600 dark:text-red-400">
				{formatCurrency(totalExpenses, accountCurrency)}
			</div>
			<p class="text-xs text-muted-foreground">
				{expenseTransactions.length} transactions (account lifetime)
			</p>
		</CardContent>
	</Card>

	<!-- Net Amount -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Net Amount (All Time)</CardTitle>
			<div class="text-2xl">📈</div>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold {getBalanceColorClass(netTransactionAmount)}">
				{formatCurrency(netTransactionAmount, accountCurrency)}
			</div>
			<p class="text-xs text-muted-foreground">
				Total income minus expenses since account creation
			</p>
		</CardContent>
	</Card>

	<!-- Current Balance -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Current Balance</CardTitle>
			<div class="text-2xl">🏦</div>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold {getBalanceColorClass(currentBalance)}">
				{formatCurrency(currentBalance, accountCurrency)}
			</div>
			<p class="text-xs text-muted-foreground">
				{currentBalance >= 0 ? 'Positive' : 'Negative'} balance
			</p>
		</CardContent>
	</Card>
</div>
