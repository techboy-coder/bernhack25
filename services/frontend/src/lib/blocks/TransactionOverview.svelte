<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { createQuery } from '@tanstack/svelte-query';
	import { getTransactions } from '$lib/api';
	import {
		TrendingUp,
		TrendingDown,
		DollarSign,
		Receipt,
		Calendar,
		AlertCircle
	} from 'lucide-svelte';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		balance: number;
	}

	// Query for transactions
	const transactionsQuery = createQuery({
		queryKey: ['transactions'],
		queryFn: () => getTransactions(),
		staleTime: 1000 * 60 * 5 // 5 minutes
	});

	// Derived calculations
	let transactions = $derived(($transactionsQuery.data as Transaction[]) || []);

	let totalIncome = $derived(
		transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
	);

	let totalExpenses = $derived(
		transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
	);

	let netAmount = $derived(totalIncome - totalExpenses);

	let averageTransaction = $derived(
		transactions.length > 0
			? transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length
			: 0
	);

	// Recent transactions (last 30 days)
	let recentTransactions = $derived(() => {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		return transactions.filter((t) => new Date(t.date) >= thirtyDaysAgo);
	});

	let isLoading = $derived($transactionsQuery.isLoading);
	let isError = $derived($transactionsQuery.isError);

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getBalanceColorClass(balance: number): string {
		if (balance > 0) return 'text-green-600 dark:text-green-400';
		if (balance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">📊 Transaction Overview</h2>
		<p class="text-muted-foreground">
			Summary of all your financial transactions and spending patterns
		</p>
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="flex flex-col items-center gap-4">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				<p class="text-sm text-muted-foreground">Loading transactions...</p>
			</div>
		</div>
	{:else if isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<AlertCircle class="size-12 text-destructive mx-auto" />
					<h3 class="font-semibold text-destructive">Error Loading Transactions</h3>
					<p class="text-sm text-muted-foreground">
						Failed to load transaction data. Please try refreshing the page.
					</p>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Statistics Overview -->
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Total Income</CardTitle>
						<TrendingUp class="size-4 text-green-600" />
					</div>
					<div class="text-2xl font-bold text-green-600">
						{formatCurrency(totalIncome)}
					</div>
					<p class="text-xs text-muted-foreground">All time income</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Total Expenses</CardTitle>
						<TrendingDown class="size-4 text-red-600" />
					</div>
					<div class="text-2xl font-bold text-red-600">
						{formatCurrency(totalExpenses)}
					</div>
					<p class="text-xs text-muted-foreground">All time expenses</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Net Amount</CardTitle>
						<DollarSign class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold {getBalanceColorClass(netAmount)}">
						{formatCurrency(netAmount)}
					</div>
					<p class="text-xs text-muted-foreground">Income - Expenses</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Avg. Transaction</CardTitle>
						<Receipt class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold">
						{formatCurrency(averageTransaction)}
					</div>
					<p class="text-xs text-muted-foreground">
						{transactions.length} total transactions
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- Recent Activity -->
		{#if recentTransactions().length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity (Last 30 Days)</CardTitle>
					<CardDescription>
						{recentTransactions().length} transactions in the last month
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#each recentTransactions().slice(0, 10) as transaction}
							<div class="flex items-center justify-between">
								<div class="space-y-1">
									<p class="text-sm font-medium">
										{formatDate(transaction.date)}
									</p>
									<div class="flex items-center gap-2">
										<Badge variant="outline" class="text-xs capitalize">
											{transaction.category}
										</Badge>
									</div>
								</div>
								<div class="text-right">
									<p
										class="font-bold {transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}"
									>
										{transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
									</p>
									<p class="text-xs text-muted-foreground">
										Balance: {formatCurrency(transaction.balance)}
									</p>
								</div>
							</div>
						{/each}

						{#if recentTransactions().length > 10}
							<div class="text-center pt-4">
								<p class="text-sm text-muted-foreground">
									And {recentTransactions().length - 10} more transactions...
								</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		{/if}

		{#if transactions.length === 0}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<Receipt class="size-12 text-muted-foreground mb-4" />
					<h3 class="text-xl font-medium mb-2">No Transactions Found</h3>
					<p class="text-muted-foreground text-center max-w-md">
						No transaction data is available yet. Transactions will appear here once you start using
						your accounts.
					</p>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
