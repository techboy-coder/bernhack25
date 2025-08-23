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
	import { Progress } from '$lib/components/ui/progress';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		balance: number;
	}

	interface SavingsOpportunity {
		category: string;
		monthlyAverage: number;
		potentialSaving: number;
		savingsPercentage: number;
		frequency: number;
		description: string;
		difficulty: 'easy' | 'medium' | 'hard';
	}

	let { transactions }: { transactions: Transaction[] } = $props();

	// Analyze spending patterns to identify savings opportunities
	const savingsOpportunities = $derived.by(() => {
		const categorySpending = new Map<string, { total: number; count: number; amounts: number[] }>();
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		// Group transactions by category (last 6 months)
		transactions
			.filter((t) => t.amount < 0 && new Date(t.date) >= sixMonthsAgo)
			.forEach((t) => {
				const category = t.category;
				const amount = Math.abs(t.amount);

				if (!categorySpending.has(category)) {
					categorySpending.set(category, { total: 0, count: 0, amounts: [] });
				}

				const data = categorySpending.get(category)!;
				data.total += amount;
				data.count += 1;
				data.amounts.push(amount);
			});

		const opportunities: SavingsOpportunity[] = [];

		categorySpending.forEach((data, category) => {
			const monthlyAverage = data.total / 6; // 6 months average
			const amounts = data.amounts.sort((a, b) => b - a);

			// Different savings strategies based on category
			let potentialSaving = 0;
			let description = '';
			let difficulty: 'easy' | 'medium' | 'hard' = 'medium';

			switch (category) {
				case 'food':
					potentialSaving = monthlyAverage * 0.25; // 25% potential savings
					description = 'Cook more meals at home, meal prep, and reduce dining out frequency';
					difficulty = 'easy';
					break;
				case 'entertainment':
					potentialSaving = monthlyAverage * 0.4; // 40% potential savings
					description = 'Find free/cheaper alternatives, cancel unused subscriptions';
					difficulty = 'easy';
					break;
				case 'shopping':
					potentialSaving = monthlyAverage * 0.3; // 30% potential savings
					description = 'Wait 24h before purchases, compare prices, buy second-hand';
					difficulty = 'medium';
					break;
				case 'transport':
					potentialSaving = monthlyAverage * 0.2; // 20% potential savings
					description = 'Use public transport, bike, or walk more often';
					difficulty = 'medium';
					break;
				case 'groceries':
					potentialSaving = monthlyAverage * 0.15; // 15% potential savings
					description = 'Plan meals, buy generic brands, use coupons and discounts';
					difficulty = 'easy';
					break;
				case 'utilities':
					potentialSaving = monthlyAverage * 0.1; // 10% potential savings
					description = 'Optimize energy usage, switch to energy-efficient appliances';
					difficulty = 'hard';
					break;
				default:
					potentialSaving = monthlyAverage * 0.1; // 10% default
					description = 'Review and optimize spending in this category';
					difficulty = 'medium';
			}

			if (monthlyAverage > 50 && potentialSaving > 10) {
				// Only show meaningful opportunities
				opportunities.push({
					category,
					monthlyAverage,
					potentialSaving,
					savingsPercentage: (potentialSaving / monthlyAverage) * 100,
					frequency: data.count,
					description,
					difficulty
				});
			}
		});

		return opportunities.sort((a, b) => b.potentialSaving - a.potentialSaving);
	});

	// Calculate total potential savings
	const totalPotentialSavings = $derived(
		savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSaving, 0)
	);

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
		switch (difficulty) {
			case 'easy':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'medium':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'hard':
				return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
		}
	}

	function getDifficultyIcon(difficulty: 'easy' | 'medium' | 'hard'): string {
		switch (difficulty) {
			case 'easy':
				return '🟢';
			case 'medium':
				return '🟡';
			case 'hard':
				return '🔴';
		}
	}

	function getCategoryIcon(category: string): string {
		switch (category) {
			case 'food':
				return '🍽️';
			case 'groceries':
				return '🛒';
			case 'entertainment':
				return '🎬';
			case 'shopping':
				return '🛍️';
			case 'transport':
				return '🚗';
			case 'utilities':
				return '💡';
			case 'healthcare':
				return '🏥';
			case 'education':
				return '📚';
			default:
				return '💰';
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">💡 Smart Savings Opportunities</h2>
		<p class="text-muted-foreground">
			AI-powered analysis of your spending patterns to identify potential savings
		</p>
	</div>

	<!-- Summary Card -->
	<Card
		class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
	>
		<CardHeader>
			<CardTitle class="flex items-center gap-2 text-green-700 dark:text-green-300">
				💰 Total Monthly Savings Potential
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-3xl font-bold text-green-600 dark:text-green-400">
				{formatCurrency(totalPotentialSavings)}
			</div>
			<p class="text-sm text-green-600 dark:text-green-400 mt-1">
				{formatCurrency(totalPotentialSavings * 12)} per year
			</p>
		</CardContent>
	</Card>

	<!-- Opportunities Grid -->
	<div class="grid gap-4 grid-cols-1 md:grid-cols-2">
		{#each savingsOpportunities as opportunity}
			<Card class="transition-all hover:shadow-lg">
				<CardHeader class="pb-4">
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-2">
							<span class="text-2xl">{getCategoryIcon(opportunity.category)}</span>
							<div>
								<CardTitle class="text-lg capitalize">{opportunity.category}</CardTitle>
								<CardDescription>
									{opportunity.frequency} transactions in last 6 months
								</CardDescription>
							</div>
						</div>
						<Badge class={getDifficultyColor(opportunity.difficulty)}>
							{getDifficultyIcon(opportunity.difficulty)}
							{opportunity.difficulty}
						</Badge>
					</div>
				</CardHeader>

				<CardContent class="space-y-4">
					<!-- Current Spending vs Potential Savings -->
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Monthly Average</span>
							<span class="font-medium">{formatCurrency(opportunity.monthlyAverage)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Potential Savings</span>
							<span class="font-medium text-green-600">
								-{formatCurrency(opportunity.potentialSaving)}
							</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">After Optimization</span>
							<span class="font-medium">
								{formatCurrency(opportunity.monthlyAverage - opportunity.potentialSaving)}
							</span>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="space-y-2">
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>Savings Potential</span>
							<span>{Math.round(opportunity.savingsPercentage)}%</span>
						</div>
						<Progress value={opportunity.savingsPercentage} class="h-2" />
					</div>

					<!-- Description -->
					<div class="p-3 bg-muted/50 rounded-md">
						<p class="text-sm text-muted-foreground">{opportunity.description}</p>
					</div>

					<!-- Annual Impact -->
					<div class="pt-2 border-t">
						<div class="flex justify-between items-center">
							<span class="text-sm font-medium">Annual Impact</span>
							<span class="text-lg font-bold text-green-600">
								{formatCurrency(opportunity.potentialSaving * 12)}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>
		{/each}

		{#if savingsOpportunities.length === 0}
			<div class="col-span-2">
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-12">
						<div class="text-6xl mb-4">📊</div>
						<h3 class="text-xl font-medium mb-2">No Savings Opportunities Identified</h3>
						<p class="text-muted-foreground text-center max-w-md">
							Either you're already optimizing your spending well, or we need more transaction data
							to provide meaningful insights.
						</p>
					</CardContent>
				</Card>
			</div>
		{/if}
	</div>
</div>
