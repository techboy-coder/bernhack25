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
	import { createQuery } from '@tanstack/svelte-query';
	import { getBankAccounts } from '$lib/api';

	let { data, accountId }: { data?: any; accountId?: string } = $props();

	// Query for bank accounts to find the specific account (fallback if no data provided)
	const accountsQuery = createQuery({
		queryKey: ['bankAccounts'],
		queryFn: () => getBankAccounts(),
		staleTime: 1000 * 60 * 5, // 5 minutes
		enabled: !data?.account // Only run if we don't have account data already
	});

	// Use provided data or find the account from the query
	let account = $derived(() => {
		// If we have account data passed in, use it
		if (data?.account) {
			return data.account;
		}

		// Otherwise, fallback to the original logic
		const accounts = $accountsQuery.data || [];
		if (accountId) {
			return accounts.find((acc: any) => acc.account.id === accountId);
		}
		return accounts[0]; // Return first account as fallback
	});

	// Helper functions
	function formatCurrency(amount: number, currency: string = 'CHF'): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function getAccountTypeBadge(type: string): {
		variant: 'default' | 'secondary' | 'outline' | 'destructive';
		label: string;
	} {
		switch (type) {
			case 'personal':
				return { variant: 'default', label: 'Personal' };
			case 'savings':
				return { variant: 'secondary', label: 'Savings' };
			case 'retirement':
				return { variant: 'outline', label: 'Retirement' };
			case 'marriage':
				return { variant: 'destructive', label: 'Marriage Fund' };
			default:
				return { variant: 'outline', label: type };
		}
	}

	function getBalanceColorClass(balance: number): string {
		if (balance > 0) return 'text-green-600 dark:text-green-400';
		if (balance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}
</script>

{#if data?.account || !$accountsQuery.isLoading}
	{#if account()}
		{@const acc = account()}
		{@const accountBadge = getAccountTypeBadge(acc.account.type)}

		<Card>
			<CardHeader>
				<div class="flex items-start justify-between">
					<div class="space-y-2">
						<div class="flex items-center gap-3">
							<CardTitle class="text-2xl">{acc.account.name}</CardTitle>
							<Badge variant={accountBadge.variant}>{accountBadge.label}</Badge>
						</div>
						<CardDescription>
							Account ID: {acc.account.id.slice(0, 8)}...
						</CardDescription>
					</div>
					<div class="text-right space-y-2">
						<div class="text-sm text-muted-foreground">Current Balance</div>
						<div class="text-2xl font-bold {getBalanceColorClass(acc.account.currentBalance)}">
							{formatCurrency(acc.account.currentBalance, acc.account.currency)}
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent class="space-y-4">
				<Separator />

				<!-- Account Statistics -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Total Transactions</p>
						<p class="text-lg font-semibold">{acc.transactionCount.toLocaleString()}</p>
					</div>

					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Monthly Income</p>
						<p class="text-lg font-semibold text-green-600">
							+{formatCurrency(acc.monthlyIncomeTotal, acc.account.currency)}
						</p>
					</div>

					<div class="space-y-1">
						<p class="text-sm text-muted-foreground">Monthly Expenses</p>
						<p class="text-lg font-semibold text-red-600">
							-{formatCurrency(acc.monthlyExpenseTotal, acc.account.currency)}
						</p>
					</div>
				</div>

				{#if acc.lastTransactionDate}
					<div class="pt-2 border-t">
						<p class="text-sm text-muted-foreground">
							Last transaction: {new Date(acc.lastTransactionDate).toLocaleDateString('en-US', {
								year: 'numeric',
								month: 'short',
								day: 'numeric'
							})}
						</p>
					</div>
				{/if}
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<h3 class="font-semibold">No Account Found</h3>
					<p class="text-sm text-muted-foreground">
						{accountId ? 'The specified account could not be found.' : 'No accounts available.'}
					</p>
				</div>
			</CardContent>
		</Card>
	{/if}
{:else if $accountsQuery.isLoading}
	<Card>
		<CardContent class="p-6">
			<div class="animate-pulse space-y-4">
				<div class="h-8 bg-muted rounded w-1/2"></div>
				<div class="h-6 bg-muted rounded w-1/3"></div>
				<div class="h-10 bg-muted rounded w-2/3"></div>
			</div>
		</CardContent>
	</Card>
{:else if $accountsQuery.isError}
	<Card class="border-destructive">
		<CardContent class="p-6">
			<div class="text-center space-y-2">
				<h3 class="font-semibold text-destructive">Error Loading Account</h3>
				<p class="text-sm text-muted-foreground">Failed to load account information.</p>
			</div>
		</CardContent>
	</Card>
{/if}
