<script lang="ts">
	import { page } from '$app/stores';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Separator } from '$lib/components/ui/separator';
	import TransactionStats from '$lib/blocks/TransactionStats.svelte';
	import TransactionCharts from '$lib/blocks/TransactionCharts.svelte';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		receiptId?: string;
		balance: number;
	}

	interface AccountSummary {
		account: {
			id: string;
			name: string;
			type: string;
			currentBalance: number;
			currency: string;
		};
		transactionCount: number;
		lastTransactionDate?: string;
		monthlyIncomeTotal: number;
		monthlyExpenseTotal: number;
	}

	interface PageData {
		account: AccountSummary;
		transactions: Transaction[];
		accountId: string;
	}

	let { data }: { data: PageData } = $props();

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

	// Helper function to format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Helper function to get account type badge
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

<svelte:head>
	<title>{data.account.account.name} - Transactions</title>
</svelte:head>

<div class="flex-1 space-y-6 p-6">
	<!-- Account Header -->
	<div class="flex flex-col space-y-4">
		<!-- Breadcrumb -->
		<nav class="flex items-center space-x-2 text-sm text-muted-foreground">
			<a href="/accounts" class="hover:text-foreground">Accounts</a>
			<span>/</span>
			<span class="text-foreground">{data.account.account.name}</span>
			<span>/</span>
			<span class="text-foreground">Transactions</span>
		</nav>

		<!-- Account Info Card -->
		<Card>
			<CardHeader>
				<div class="flex items-start justify-between">
					<div class="space-y-2">
						{#if data.account}
							{@const accountBadge = getAccountTypeBadge(data.account.account.type)}
							<div class="flex items-center gap-3">
								<CardTitle class="text-2xl">{data.account.account.name}</CardTitle>
								<Badge variant={accountBadge.variant}>{accountBadge.label}</Badge>
							</div>
						{/if}
						<CardDescription>
							Account ID: {data.account.account.id}
						</CardDescription>
					</div>
					<div class="text-right space-y-2">
						<div class="text-sm text-muted-foreground">Current Balance</div>
						<div
							class="text-2xl font-bold {getBalanceColorClass(data.account.account.currentBalance)}"
						>
							{formatCurrency(data.account.account.currentBalance, data.account.account.currency)}
						</div>
					</div>
				</div>
			</CardHeader>
		</Card>
	</div>

	<!-- Tabs for different views -->
	<Tabs value="overview" class="w-full">
		<TabsList class="grid w-full grid-cols-2">
			<TabsTrigger value="overview">Charts Overview</TabsTrigger>
			<TabsTrigger value="transactions">Transaction List</TabsTrigger>
		</TabsList>

		<TabsContent value="overview" class="space-y-8">
			<!-- Transaction Statistics -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Transaction Statistics</h2>
					<Badge variant="outline">{data.transactions.length} total transactions</Badge>
				</div>
				<TransactionStats
					transactions={data.transactions}
					accountCurrency={data.account.account.currency}
				/>
			</div>

			<Separator />

			<!-- Charts -->
			<div class="space-y-4">
				<h2 class="text-lg font-semibold">Charts & Analytics</h2>
				<TransactionCharts
					transactions={data.transactions}
					accountCurrency={data.account.account.currency}
				/>
			</div>
		</TabsContent>

		<TabsContent value="transactions" class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Recent Transactions</h2>
				<div class="flex gap-2">
					<Button variant="outline" size="sm">Filter</Button>
					<Button variant="outline" size="sm">Export</Button>
				</div>
			</div>

			<!-- Transaction Table -->
			<Card>
				<CardContent class="p-0">
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/50">
								<tr>
									<th class="text-left p-4 font-medium">Date</th>
									<th class="text-left p-4 font-medium">Amount</th>
									<th class="text-left p-4 font-medium">Category</th>
									<th class="text-left p-4 font-medium">Balance</th>
								</tr>
							</thead>
							<tbody>
								{#each data.transactions.slice().reverse().slice(0, 50) as transaction}
									<tr class="border-b hover:bg-muted/50">
										<td class="p-4">
											{formatDate(transaction.date)}
										</td>
										<td class="p-4">
											<span
												class="font-medium {transaction.amount >= 0
													? 'text-green-600'
													: 'text-red-600'}"
											>
												{transaction.amount >= 0 ? '+' : ''}{formatCurrency(
													transaction.amount,
													data.account.account.currency
												)}
											</span>
										</td>
										<td class="p-4">
											<Badge variant="outline" class="text-xs capitalize">
												{transaction.category}
											</Badge>
										</td>
										<td class="p-4">
											<span class="text-sm {getBalanceColorClass(transaction.balance)}">
												{formatCurrency(transaction.balance, data.account.account.currency)}
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
						{#if data.transactions.length > 50}
							<div class="p-4 text-center text-sm text-muted-foreground border-t">
								Showing latest 50 transactions of {data.transactions.length} total
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
