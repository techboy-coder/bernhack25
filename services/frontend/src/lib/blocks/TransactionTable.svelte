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
	import { Input } from '$lib/components/ui/input';
	import { createQuery } from '@tanstack/svelte-query';
	import { getTransactions } from '$lib/api';
	import { Search, ArrowUpDown } from 'lucide-svelte';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		balance: number;
		receiptId?: string;
	}

	let { accountId, maxRows = 50 }: { accountId?: string; maxRows?: number } = $props();

	// State for filtering and sorting
	let searchTerm = $state('');
	let sortColumn = $state<keyof Transaction>('date');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	// Query for transactions
	const transactionsQuery = createQuery({
		queryKey: ['transactions', accountId],
		queryFn: () => getTransactions({ accountId }),
		staleTime: 1000 * 60 * 5 // 5 minutes
	});

	// Derived filtered and sorted transactions
	let filteredTransactions = $derived(() => {
		const transactions = ($transactionsQuery.data as Transaction[]) || [];

		// Filter by search term
		const filtered = transactions.filter((transaction) => {
			const searchLower = searchTerm.toLowerCase();
			return (
				transaction.category.toLowerCase().includes(searchLower) ||
				transaction.amount.toString().includes(searchLower) ||
				new Date(transaction.date).toLocaleDateString().includes(searchLower)
			);
		});

		// Sort transactions
		const sorted = filtered.sort((a, b) => {
			let aValue = a[sortColumn];
			let bValue = b[sortColumn];

			// Handle different data types
			if (sortColumn === 'date') {
				aValue = new Date(a.date).getTime();
				bValue = new Date(b.date).getTime();
			} else if (typeof aValue === 'string') {
				aValue = aValue.toLowerCase();
				bValue = (bValue as string).toLowerCase();
			}

			if (sortDirection === 'asc') {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return sorted.slice(0, maxRows);
	});

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getBalanceColorClass(balance: number): string {
		if (balance > 0) return 'text-green-600 dark:text-green-400';
		if (balance < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-600 dark:text-gray-400';
	}

	function handleSort(column: keyof Transaction) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'desc';
		}
	}
</script>

<div class="space-y-4">
	<!-- Header with search -->
	<Card>
		<CardHeader class="pb-3">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<CardTitle>Transaction History</CardTitle>
					<CardDescription>
						{$transactionsQuery.data?.length || 0} transactions
						{maxRows < ($transactionsQuery.data?.length || 0) ? ` (showing first ${maxRows})` : ''}
					</CardDescription>
				</div>

				<div class="relative w-full sm:w-64">
					<Search
						class="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground"
					/>
					<Input placeholder="Search transactions..." bind:value={searchTerm} class="pl-8" />
				</div>
			</div>
		</CardHeader>
	</Card>

	<!-- Transaction Table -->
	{#if $transactionsQuery.isLoading}
		<Card>
			<CardContent class="p-6">
				<div class="space-y-3">
					{#each Array(5) as _}
						<div class="animate-pulse flex items-center space-x-4">
							<div class="h-4 bg-muted rounded flex-1"></div>
							<div class="h-4 bg-muted rounded w-20"></div>
							<div class="h-4 bg-muted rounded w-24"></div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else if $transactionsQuery.isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<h3 class="font-semibold text-destructive">Error Loading Transactions</h3>
					<p class="text-sm text-muted-foreground">Failed to load transaction data.</p>
				</div>
			</CardContent>
		</Card>
	{:else if filteredTransactions().length === 0}
		<Card>
			<CardContent class="p-12">
				<div class="text-center space-y-2">
					<h3 class="font-semibold">No Transactions Found</h3>
					<p class="text-sm text-muted-foreground">
						{searchTerm
							? 'No transactions match your search criteria.'
							: 'No transactions available.'}
					</p>
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="p-0">
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="border-b bg-muted/50">
							<tr>
								<th class="text-left p-4">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleSort('date')}
										class="h-auto p-0 font-semibold hover:bg-transparent"
									>
										Date
										<ArrowUpDown class="ml-2 size-3" />
									</Button>
								</th>
								<th class="text-left p-4">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleSort('amount')}
										class="h-auto p-0 font-semibold hover:bg-transparent"
									>
										Amount
										<ArrowUpDown class="ml-2 size-3" />
									</Button>
								</th>
								<th class="text-left p-4">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleSort('category')}
										class="h-auto p-0 font-semibold hover:bg-transparent"
									>
										Category
										<ArrowUpDown class="ml-2 size-3" />
									</Button>
								</th>
								<th class="text-left p-4">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleSort('balance')}
										class="h-auto p-0 font-semibold hover:bg-transparent"
									>
										Balance
										<ArrowUpDown class="ml-2 size-3" />
									</Button>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredTransactions() as transaction}
								<tr class="border-b hover:bg-muted/50">
									<td class="p-4">
										<div class="space-y-1">
											<p class="text-sm font-medium">
												{formatDate(transaction.date)}
											</p>
											<p class="text-xs text-muted-foreground">
												ID: {transaction.id.slice(0, 8)}...
											</p>
										</div>
									</td>
									<td class="p-4">
										<span
											class="font-bold {transaction.amount >= 0
												? 'text-green-600'
												: 'text-red-600'}"
										>
											{transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
										</span>
									</td>
									<td class="p-4">
										<Badge variant="outline" class="text-xs capitalize">
											{transaction.category}
										</Badge>
									</td>
									<td class="p-4">
										<span class="text-sm {getBalanceColorClass(transaction.balance)}">
											{formatCurrency(transaction.balance)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
