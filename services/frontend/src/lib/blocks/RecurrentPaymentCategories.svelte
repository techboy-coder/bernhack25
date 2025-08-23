<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { createQuery } from '@tanstack/svelte-query';
	import { getRecurrentPayments } from '$lib/api';
	import { PieChart } from 'lucide-svelte';

	interface RecurrentPayment {
		id: string;
		amount: number;
		name: string;
		category: string;
		frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
		startDate: string;
		endDate?: string;
		autoPay: boolean;
	}

	// Query for recurrent payments
	const paymentsQuery = createQuery({
		queryKey: ['recurrentPayments'],
		queryFn: () => getRecurrentPayments(),
		staleTime: 1000 * 60 * 5
	});

	// Derived calculations
	let recurrentPayments = $derived(($paymentsQuery.data as RecurrentPayment[]) || []);

	let categoryBreakdown = $derived(() => {
		const breakdown = new Map<
			string,
			{ total: number; count: number; payments: RecurrentPayment[] }
		>();

		recurrentPayments.forEach((payment) => {
			const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency);
			const existing = breakdown.get(payment.category) || { total: 0, count: 0, payments: [] };

			breakdown.set(payment.category, {
				total: existing.total + monthlyAmount,
				count: existing.count + 1,
				payments: [...existing.payments, payment]
			});
		});

		return Array.from(breakdown.entries())
			.map(([category, data]) => ({ category, ...data }))
			.sort((a, b) => b.total - a.total);
	});

	let totalMonthlyAmount = $derived(categoryBreakdown().reduce((sum, cat) => sum + cat.total, 0));

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function calculateMonthlyAmount(amount: number, frequency: string): number {
		switch (frequency) {
			case 'weekly':
				return amount * 4.33;
			case 'monthly':
				return amount;
			case 'quarterly':
				return amount / 3;
			case 'yearly':
				return amount / 12;
			default:
				return amount;
		}
	}

	function getCategoryIcon(category: string): string {
		const icons: Record<string, string> = {
			housing: '🏠',
			food: '🍽️',
			transport: '🚗',
			entertainment: '🎬',
			utilities: '💡',
			healthcare: '🏥',
			education: '📚',
			shopping: '🛍️',
			travel: '✈️',
			other: '💰'
		};
		return icons[category] || '💰';
	}

	function getCategoryColor(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500',
			'bg-yellow-500',
			'bg-red-500',
			'bg-purple-500',
			'bg-pink-500',
			'bg-indigo-500',
			'bg-orange-500',
			'bg-teal-500',
			'bg-gray-500'
		];
		return colors[index % colors.length];
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">📊 Payment Categories</h2>
		<p class="text-muted-foreground">
			Breakdown of your recurring payments by category and spending patterns
		</p>
	</div>

	{#if $paymentsQuery.isLoading}
		<div class="space-y-4">
			{#each Array(6) as _}
				<Card>
					<CardContent class="p-4">
						<div class="animate-pulse space-y-3">
							<div class="flex items-center gap-3">
								<div class="h-6 w-6 bg-muted rounded"></div>
								<div class="h-4 bg-muted rounded flex-1"></div>
								<div class="h-4 bg-muted rounded w-16"></div>
							</div>
							<div class="h-2 bg-muted rounded"></div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if $paymentsQuery.isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<PieChart class="size-12 text-destructive mx-auto" />
					<h3 class="font-semibold text-destructive">Error Loading Categories</h3>
					<p class="text-sm text-muted-foreground">Failed to load payment category data.</p>
				</div>
			</CardContent>
		</Card>
	{:else if categoryBreakdown().length === 0}
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12">
				<PieChart class="size-12 text-muted-foreground mb-4" />
				<h3 class="text-xl font-medium mb-2">No Categories Found</h3>
				<p class="text-muted-foreground text-center max-w-md">
					No recurring payments to categorize yet. Add some payments to see the category breakdown.
				</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Summary Card -->
		<Card>
			<CardHeader>
				<CardTitle>Monthly Spending Overview</CardTitle>
				<CardDescription>
					Total: {formatCurrency(totalMonthlyAmount)} across {categoryBreakdown().length} categories
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="text-3xl font-bold text-center py-4">
					{formatCurrency(totalMonthlyAmount)}
					<div class="text-sm text-muted-foreground font-normal mt-1">
						{formatCurrency(totalMonthlyAmount * 12)} annually
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Category Breakdown -->
		<div class="space-y-4">
			{#each categoryBreakdown() as category, index}
				{@const percentage =
					totalMonthlyAmount > 0 ? (category.total / totalMonthlyAmount) * 100 : 0}

				<Card>
					<CardHeader class="pb-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="text-2xl">{getCategoryIcon(category.category)}</span>
								<div>
									<CardTitle class="text-lg capitalize">{category.category}</CardTitle>
									<CardDescription
										>{category.count} payment{category.count !== 1 ? 's' : ''}</CardDescription
									>
								</div>
							</div>
							<div class="text-right">
								<div class="text-xl font-bold">{formatCurrency(category.total)}</div>
								<div class="text-sm text-muted-foreground">{percentage.toFixed(1)}% of total</div>
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-4">
						<!-- Progress Bar -->
						<Progress value={percentage} class="h-3" />

						<!-- Payment List -->
						<div class="space-y-2">
							{#each category.payments as payment}
								<div class="flex items-center justify-between text-sm">
									<span class="truncate flex-1">{payment.name}</span>
									<div class="flex items-center gap-2 ml-2">
										<span class="font-medium">
											{formatCurrency(calculateMonthlyAmount(payment.amount, payment.frequency))}
										</span>
										<span class="text-muted-foreground">/{payment.frequency}</span>
									</div>
								</div>
							{/each}
						</div>

						<!-- Annual Projection -->
						<div class="pt-2 border-t">
							<div class="flex justify-between items-center text-sm">
								<span class="text-muted-foreground">Annual spend in this category</span>
								<span class="font-semibold">{formatCurrency(category.total * 12)}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
