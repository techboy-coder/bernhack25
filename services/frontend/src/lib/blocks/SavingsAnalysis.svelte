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
	import { createQuery } from '@tanstack/svelte-query';
	import { getSavingsProfiles } from '$lib/api';
	import { TrendingUp, Target, Calendar, PieChart, AlertCircle } from 'lucide-svelte';

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

	interface SavingsProfile {
		id: string;
		name: string;
		currentAmount: number;
		targetAmount: number;
		startDate: string;
		targetDate?: string;
		category: string;
	}

	let { transactions = [] }: { transactions: Transaction[] } = $props();

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

	// Query for savings profiles
	const savingsQuery = createQuery({
		queryKey: ['savingsProfiles'],
		queryFn: () => getSavingsProfiles(),
		staleTime: 1000 * 60 * 5
	});

	// Derived calculations
	let savingsProfiles = $derived(($savingsQuery.data as SavingsProfile[]) || []);

	let totalTargetAmount = $derived(
		savingsProfiles.reduce((sum, profile) => sum + profile.targetAmount, 0)
	);

	let totalCurrentAmount = $derived(
		savingsProfiles.reduce((sum, profile) => sum + profile.currentAmount, 0)
	);

	let totalSavingsRate = $derived(
		totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0
	);

	let completedGoals = $derived(
		savingsProfiles.filter((profile) => profile.currentAmount >= profile.targetAmount).length
	);

	let activeGoals = $derived(
		savingsProfiles.filter((profile) => profile.currentAmount < profile.targetAmount).length
	);

	// Calculate savings from transactions
	let savingsTransactions = $derived(
		transactions.filter(
			(t) =>
				t.amount > 0 &&
				(t.category.toLowerCase().includes('savings') ||
					t.category.toLowerCase().includes('transfer'))
		)
	);

	let totalSavingsFromTransactions = $derived(
		savingsTransactions.reduce((sum, t) => sum + t.amount, 0)
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

	function getProgressColor(percentage: number): string {
		if (percentage >= 100) return 'bg-green-500';
		if (percentage >= 75) return 'bg-blue-500';
		if (percentage >= 50) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function getDaysToTarget(profile: SavingsProfile): number | null {
		if (!profile.targetDate) return null;
		const target = new Date(profile.targetDate);
		const now = new Date();
		return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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

	<!-- Savings Analysis -->
	<div class="space-y-6">
		<!-- Header -->
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">📈 Savings Analysis</h2>
			<p class="text-muted-foreground">
				Detailed analysis of your savings performance and goal achievement
			</p>
		</div>

		{#if $savingsQuery.isLoading}
			<div class="flex justify-center items-center py-12">
				<div class="flex flex-col items-center gap-4">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					<p class="text-sm text-muted-foreground">Loading savings analysis...</p>
				</div>
			</div>
		{:else if $savingsQuery.isError}
			<Card class="border-destructive">
				<CardContent class="p-6">
					<div class="text-center space-y-2">
						<AlertCircle class="size-12 text-destructive mx-auto" />
						<h3 class="font-semibold text-destructive">Error Loading Analysis</h3>
						<p class="text-sm text-muted-foreground">Failed to load savings analysis data.</p>
					</div>
				</CardContent>
			</Card>
		{:else}
			<!-- Overview Statistics -->
			<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardContent class="p-6">
						<div class="flex items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium">Overall Progress</CardTitle>
							<Target class="size-4 text-muted-foreground" />
						</div>
						<div class="text-2xl font-bold">{totalSavingsRate.toFixed(1)}%</div>
						<p class="text-xs text-muted-foreground">
							{formatCurrency(totalCurrentAmount)} of {formatCurrency(totalTargetAmount)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium">Completed Goals</CardTitle>
							<TrendingUp class="size-4 text-green-600" />
						</div>
						<div class="text-2xl font-bold text-green-600">{completedGoals}</div>
						<p class="text-xs text-muted-foreground">
							{activeGoals} still active
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium">Total Saved</CardTitle>
							<PieChart class="size-4 text-muted-foreground" />
						</div>
						<div class="text-2xl font-bold">{formatCurrency(totalCurrentAmount)}</div>
						<p class="text-xs text-muted-foreground">
							Across {savingsProfiles.length} goals
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="p-6">
						<div class="flex items-center justify-between space-y-0 pb-2">
							<CardTitle class="text-sm font-medium">From Transactions</CardTitle>
							<Calendar class="size-4 text-muted-foreground" />
						</div>
						<div class="text-2xl font-bold">{formatCurrency(totalSavingsFromTransactions)}</div>
						<p class="text-xs text-muted-foreground">
							{savingsTransactions.length} savings transactions
						</p>
					</CardContent>
				</Card>
			</div>

			<!-- Goal Progress Details -->
			{#if savingsProfiles.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Goal Progress Details</CardTitle>
						<CardDescription>Individual analysis for each savings goal</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						{#each savingsProfiles as profile}
							{@const progress =
								profile.targetAmount > 0 ? (profile.currentAmount / profile.targetAmount) * 100 : 0}
							{@const remaining = Math.max(0, profile.targetAmount - profile.currentAmount)}
							{@const daysToTarget = getDaysToTarget(profile)}

							<div class="space-y-3 p-4 border rounded-lg">
								<div class="flex items-start justify-between">
									<div class="space-y-1">
										<h3 class="font-semibold">{profile.name}</h3>
										<Badge variant="outline" class="text-xs capitalize">{profile.category}</Badge>
									</div>
									<div class="text-right space-y-1">
										<div class="text-sm font-bold">
											{formatCurrency(profile.currentAmount)} / {formatCurrency(
												profile.targetAmount
											)}
										</div>
										<div class="text-xs text-muted-foreground">
											{progress >= 100
												? 'Goal Achieved! 🎉'
												: `${formatCurrency(remaining)} remaining`}
										</div>
									</div>
								</div>

								<Progress value={Math.min(progress, 100)} class="h-3" />

								<div class="flex items-center justify-between text-xs text-muted-foreground">
									<span>{progress.toFixed(1)}% complete</span>
									{#if daysToTarget !== null}
										<span>
											{daysToTarget > 0 ? `${daysToTarget} days remaining` : 'Target date passed'}
										</span>
									{/if}
								</div>

								{#if progress >= 100}
									<div class="flex items-center gap-2 text-green-600 text-sm">
										<TrendingUp class="size-4" />
										<span class="font-medium">Goal Successfully Achieved!</span>
									</div>
								{:else if progress >= 75}
									<div class="flex items-center gap-2 text-blue-600 text-sm">
										<Target class="size-4" />
										<span>Almost there - great progress!</span>
									</div>
								{:else if progress >= 25}
									<div class="flex items-center gap-2 text-yellow-600 text-sm">
										<Calendar class="size-4" />
										<span>Good start - keep it up!</span>
									</div>
								{:else}
									<div class="flex items-center gap-2 text-red-600 text-sm">
										<AlertCircle class="size-4" />
										<span>Consider increasing contributions</span>
									</div>
								{/if}
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}

			{#if savingsProfiles.length === 0}
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-12">
						<Target class="size-12 text-muted-foreground mb-4" />
						<h3 class="text-xl font-medium mb-2">No Savings Goals Found</h3>
						<p class="text-muted-foreground text-center max-w-md">
							Create your first savings goal to start tracking your progress and get personalized
							analysis.
						</p>
					</CardContent>
				</Card>
			{/if}
		{/if}
	</div>
</div>
