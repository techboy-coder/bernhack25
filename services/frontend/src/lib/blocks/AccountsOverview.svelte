<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';

	interface AccountSummary {
		account: {
			id: string;
			name: string;
			type: string;
			currentBalance: number;
			currency: string;
		};
		transactionCount: number;
		lastTransactionDate?: string | undefined;
		monthlyIncomeTotal: number;
		monthlyExpenseTotal: number;
	}

	interface AccountsData {
		bankAccounts: AccountSummary[];
		error?: string;
	}

	let { data }: { data: AccountsData } = $props();

	// Add loading state check
	const isLoading = $derived(!data || (!data.bankAccounts && !data.error));
	const hasError = $derived(
		data?.error || (data?.bankAccounts && data.bankAccounts.length === 0 && data.error)
	);

	// Helper function to format currency
	function formatCurrency(amount: number, currency: string = 'CHF'): string {
		const isNegative = amount < 0;
		const absAmount = Math.abs(amount);
		const formatted = new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2
		}).format(absAmount);

		return isNegative ? `-${formatted}` : formatted;
	}

	// Helper function to format date
	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'No recent transactions';
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(new Date(dateString));
	}

	// Helper function to get account type badge variant
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

	// Helper function to get balance color class
	function getBalanceColorClass(balance: number): string {
		if (balance > 0) return 'text-green-600 dark:text-green-400';
		if (balance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center py-8">
		<div class="text-center space-y-2">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
			<p class="text-sm text-muted-foreground">Loading accounts...</p>
		</div>
	</div>
{:else if hasError}
	<Card class="border-destructive">
		<CardContent class="p-6">
			<div class="text-center space-y-2">
				<div class="text-4xl">⚠️</div>
				<h3 class="font-semibold text-destructive">Error Loading Accounts</h3>
				<p class="text-sm text-muted-foreground">
					{data.error || 'Unable to connect to the server. Please check if the backend is running.'}
				</p>
				<Button variant="outline" onclick={() => window.location.reload()} class="mt-4">
					Retry
				</Button>
			</div>
		</CardContent>
	</Card>
{:else if !data.bankAccounts || data.bankAccounts.length === 0}
	<Card class="text-center py-12">
		<CardContent class="space-y-6">
			<div class="text-6xl">🏦</div>
			<div class="space-y-2">
				<h3 class="text-lg font-semibold">No Bank Accounts Found</h3>
				<p class="text-muted-foreground max-w-sm mx-auto">
					You don't have any bank accounts set up yet.
				</p>
			</div>
		</CardContent>
	</Card>
{:else}
	<!-- Account Cards Grid -->
	<div class="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
		{#each data.bankAccounts as accountSummary}
			{@const accountBadge = getAccountTypeBadge(accountSummary.account.type)}
			{@const balanceClass = getBalanceColorClass(accountSummary.account.currentBalance)}

			<Card class="transition-all hover:shadow-lg">
				<CardHeader class="pb-4">
					<div class="flex items-start justify-between">
						<div class="space-y-1">
							<CardTitle class="text-lg">{accountSummary.account.name}</CardTitle>
							<CardDescription>
								ID: {accountSummary.account.id.slice(0, 8)}...
							</CardDescription>
						</div>
						<Badge variant={accountBadge.variant}>
							{accountBadge.label}
						</Badge>
					</div>
				</CardHeader>

				<CardContent class="space-y-6">
					<!-- Balance Section -->
					<div class="space-y-2">
						<p class="text-sm font-medium text-muted-foreground">Current Balance</p>
						<p class="text-2xl font-bold {balanceClass}">
							{formatCurrency(
								accountSummary.account.currentBalance,
								accountSummary.account.currency
							)}
						</p>
					</div>

					<Separator />

					<!-- Statistics Grid -->
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-1">
							<p class="text-sm text-muted-foreground">Transactions</p>
							<p class="font-semibold">{accountSummary.transactionCount.toLocaleString()}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm text-muted-foreground">Last Activity</p>
							<p class="text-xs font-medium">
								{formatDate(accountSummary.lastTransactionDate)}
							</p>
						</div>
					</div>

					<!-- Monthly Summary -->
					<div class="space-y-3">
						<p class="text-sm font-medium text-muted-foreground">Last 30 Days</p>
						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<span class="text-sm text-muted-foreground">Income:</span>
								<span class="text-sm font-medium text-green-600 dark:text-green-400">
									+{formatCurrency(
										accountSummary.monthlyIncomeTotal,
										accountSummary.account.currency
									)}
								</span>
							</div>
							<div class="flex justify-between items-center">
								<span class="text-sm text-muted-foreground">Expenses:</span>
								<span class="text-sm font-medium text-red-600 dark:text-red-400">
									-{formatCurrency(
										accountSummary.monthlyExpenseTotal,
										accountSummary.account.currency
									)}
								</span>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							class="w-full"
							href="/accounts/{accountSummary.account.id}/transactions"
						>
							View Transactions
						</Button>
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<div class="p-3"></div>
	<!-- Summary Statistics Card -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">📊 Account Summary</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				<div class="space-y-2">
					<p class="text-sm text-muted-foreground">Total Accounts</p>
					<p class="text-2xl font-bold">{data.bankAccounts.length}</p>
				</div>

				<div class="space-y-2">
					<p class="text-sm text-muted-foreground">Total Balance</p>
					<p
						class="text-2xl font-bold {getBalanceColorClass(
							data.bankAccounts.reduce((sum, acc) => sum + acc.account.currentBalance, 0)
						)}"
					>
						{formatCurrency(
							data.bankAccounts.reduce((sum, acc) => sum + acc.account.currentBalance, 0)
						)}
					</p>
				</div>

				<div class="space-y-2">
					<p class="text-sm text-muted-foreground">Total Transactions</p>
					<p class="text-2xl font-bold">
						{data.bankAccounts.reduce((sum, acc) => sum + acc.transactionCount, 0).toLocaleString()}
					</p>
				</div>
			</div>
		</CardContent>
	</Card>
{/if}
