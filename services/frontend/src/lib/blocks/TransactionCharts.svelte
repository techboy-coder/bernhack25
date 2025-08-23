<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		receiptId?: string;
		balance: number;
	}

	interface TransactionChartsProps {
		transactions: Transaction[];
		accountCurrency?: string;
	}

	let { transactions, accountCurrency = 'CHF' }: TransactionChartsProps = $props();

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

	// Group transactions by month
	let monthlyData = $derived(
		(() => {
			const grouped = new Map<string, { income: number; expenses: number; net: number }>();

			transactions.forEach((transaction) => {
				const date = new Date(transaction.date);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

				if (!grouped.has(monthKey)) {
					grouped.set(monthKey, { income: 0, expenses: 0, net: 0 });
				}

				const data = grouped.get(monthKey)!;
				if (transaction.amount > 0) {
					data.income += transaction.amount;
				} else {
					data.expenses += Math.abs(transaction.amount);
				}
				data.net = data.income - data.expenses;
			});

			// Convert to array and sort by date
			return Array.from(grouped.entries())
				.map(([month, data]) => ({ month, ...data }))
				.sort((a, b) => a.month.localeCompare(b.month))
				.slice(-12); // Last 12 months
		})()
	);

	// Calculate max values for scaling
	let maxIncome = $derived(Math.max(...monthlyData.map((d) => d.income), 1));
	let maxExpenses = $derived(Math.max(...monthlyData.map((d) => d.expenses), 1));
	let maxValue = $derived(Math.max(maxIncome, maxExpenses));

	// Group by categories for pie chart data
	let categoryData = $derived(
		(() => {
			const categoryTotals = new Map<string, number>();

			transactions
				.filter((t) => t.amount < 0)
				.forEach((transaction) => {
					const amount = Math.abs(transaction.amount);
					categoryTotals.set(
						transaction.category,
						(categoryTotals.get(transaction.category) || 0) + amount
					);
				});

			return Array.from(categoryTotals.entries())
				.map(([category, amount]) => ({ category, amount }))
				.sort((a, b) => b.amount - a.amount)
				.slice(0, 6); // Top 6 categories
		})()
	);

	let totalExpenses = $derived(categoryData.reduce((sum, cat) => sum + cat.amount, 0));

	// Format month for display
	function formatMonth(monthKey: string): string {
		const [year, month] = monthKey.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1);
		return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
	}

	// Get category color
	function getCategoryColor(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-yellow-500',
			'bg-purple-500',
			'bg-red-500',
			'bg-orange-500'
		];
		return colors[index % colors.length];
	}
</script>

<div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
	<!-- Monthly Income vs Expenses Chart -->
	<Card class="col-span-1 lg:col-span-2">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">📊 Monthly Income vs Expenses</CardTitle>
			<CardDescription>
				Last 12 months comparison (showing {monthlyData.length} months)
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each monthlyData as data}
					<div class="space-y-2">
						<div class="flex justify-between items-center text-sm">
							<span class="font-medium">{formatMonth(data.month)}</span>
							<div class="flex gap-4 text-xs">
								<span class="text-green-600">+{formatCurrency(data.income, accountCurrency)}</span>
								<span class="text-red-600">-{formatCurrency(data.expenses, accountCurrency)}</span>
								<span class="font-medium {data.net >= 0 ? 'text-green-600' : 'text-red-600'}">
									{formatCurrency(data.net, accountCurrency)}
								</span>
							</div>
						</div>
						<div class="flex gap-1 h-6 bg-gray-100 dark:bg-gray-800 rounded">
							<!-- Income bar -->
							<div
								class="bg-green-500 rounded-l transition-all duration-300"
								style="width: {(data.income / maxValue) * 50}%"
							></div>
							<!-- Expenses bar -->
							<div
								class="bg-red-500 rounded-r transition-all duration-300"
								style="width: {(data.expenses / maxValue) * 50}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Expense Categories -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">🏷️ Top Expense Categories</CardTitle>
			<CardDescription>Breakdown by spending category</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each categoryData as { category, amount }, index}
					{@const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded {getCategoryColor(index)}"></div>
								<span class="text-sm font-medium capitalize">{category}</span>
							</div>
							<div class="text-right">
								<div class="text-sm font-bold">{formatCurrency(amount, accountCurrency)}</div>
								<div class="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
							</div>
						</div>
						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all duration-300 {getCategoryColor(index)}"
								style="width: {percentage}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>

	<!-- Balance Trend -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">📈 Balance Trend</CardTitle>
			<CardDescription>Monthly net balance over time</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="space-y-3">
				{#each monthlyData as data}
					{@const isPositive = data.net >= 0}
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">{formatMonth(data.month)}</span>
						<div class="flex items-center gap-2">
							<Badge variant={isPositive ? 'default' : 'destructive'} class="text-xs">
								{formatCurrency(data.net, accountCurrency)}
							</Badge>
							<div class="w-2 h-2 rounded-full {isPositive ? 'bg-green-500' : 'bg-red-500'}"></div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>
