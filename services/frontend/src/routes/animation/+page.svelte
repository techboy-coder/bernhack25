<script lang="ts">
	// Single file presentation with no external imports
	// All functionality consolidated in one file with simplified data
	import { AreaChart, PieChart, Text } from 'layerchart';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import TrendingUpIcon from 'lucide-svelte/icons/trending-up';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	import { Confetti } from 'svelte-confetti';

	// Basic presentation state
	let currentSlide = $state(0);
	let totalSlides = 11;
	let isTransitioning = $state(false);

	// Mock data since we're not importing API functions
	let mockData = $state({
		totalSpent: 15482.75,
		totalEarned: 32450.0,
		totalTransactions: 246,
		topCategory: { name: 'Food & Groceries', amount: 3620.45 },
		biggestMonth: { month: 'December', amount: 2340.67 },
		biggestSpend: {
			amount: -1250.0,
			date: '2024-07-15',
			category: 'Housing',
			description: 'Monthly Rent'
		},
		monthlySpending: [1250, 1100, 1320, 980, 1450, 1200, 1500, 1380, 1600, 1700, 1890, 2340.67],
		categorySpending: {
			'Food & Groceries': 3620.45,
			Housing: 6000.0,
			Entertainment: 1200.3,
			Transportation: 987.5,
			Shopping: 2300.5,
			Healthcare: 875.0,
			Education: 500.0
		},
		accounts: [
			{
				account: {
					id: 'acc-001',
					name: 'Personal Checking',
					type: 'checking',
					currentBalance: 3240.5
				},
				transactionCount: 158
			},
			{
				account: {
					id: 'acc-002',
					name: 'Savings Account',
					type: 'savings',
					currentBalance: 12750.0
				},
				transactionCount: 45
			}
		],
		savingsProfiles: [
			{
				id: 'sav-001',
				name: 'Vacation Fund',
				category: 'travel',
				targetAmount: 3000.0,
				currentAmount: 1750.0
			},
			{
				id: 'sav-002',
				name: 'Emergency Fund',
				category: 'emergency',
				targetAmount: 10000.0,
				currentAmount: 7500.0
			},
			{
				id: 'sav-003',
				name: 'New Car',
				category: 'transportation',
				targetAmount: 25000.0,
				currentAmount: 5200.0
			}
		]
	});

	// Convert monthly spending to chart data format
	const chartData = $derived(
		mockData.monthlySpending.map((amount, index) => {
			const date = new Date(2024, index, 1); // Using 2024 as the year
			return {
				date,
				expenses: amount,
				savings: mockData.totalEarned / 12 - amount // Estimated monthly savings
			};
		})
	);

	// Chart configuration
	const chartConfig = {
		expenses: { label: 'Expenses', color: 'var(--chart-1)' },
		savings: { label: 'Savings', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;

	// Income vs Expenses pie chart data
	const incomeVsExpensesData = $derived([
		{ type: 'Income', amount: mockData.totalEarned, color: 'var(--chart-2)' },
		{ type: 'Expenses', amount: mockData.totalSpent, color: 'var(--chart-1)' }
	]);

	// Chart configuration for income vs expenses
	const incomeExpensesConfig = {
		amount: { label: 'Amount' },
		Income: { label: 'Income', color: 'var(--chart-2)' },
		Expenses: { label: 'Expenses', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	// Currency formatter
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 2
		}).format(amount);
	}

	// Date formatter
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Percentage formatter
	function formatPercent(value: number, total: number): string {
		return ((value / total) * 100).toFixed(1) + '%';
	}

	// Functions to control slide navigation
	function nextSlide() {
		if (currentSlide < totalSlides - 1) {
			isTransitioning = true;
			setTimeout(() => {
				currentSlide++;
				isTransitioning = false;
			}, 300);
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			isTransitioning = true;
			setTimeout(() => {
				currentSlide--;
				isTransitioning = false;
			}, 300);
		}
	}

	function goToSlide(index: number) {
		if (index >= 0 && index < totalSlides) {
			isTransitioning = true;
			setTimeout(() => {
				currentSlide = index;
				isTransitioning = false;
			}, 300);
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowRight' || event.key === 'Space') {
			nextSlide();
		} else if (event.key === 'ArrowLeft') {
			prevSlide();
		}
	}
</script>

<svelte:head>
	<title>Spendcast Wrapped 2024</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="bg-background text-foreground min-h-screen flex flex-col">
	<!-- Progress Bar -->
	<div class="fixed top-0 left-0 right-0 h-1 bg-muted z-40">
		<div
			class="h-full bg-gradient-to-r from-chart-1 to-chart-5 transition-all duration-300"
			style="width: {((currentSlide + 1) / totalSlides) * 100}%"
		></div>
	</div>

	<!-- Slide Container -->
	<div
		class="flex-1 flex items-center justify-center transition-opacity duration-300"
		class:opacity-50={isTransitioning}
	>
		<!-- Slide Content - Each section represents a slide -->
		{#if currentSlide === 0}
			<!-- Slide 1: Welcome -->
			<div class="max-w-4xl w-full p-8 text-center">
				<div class="animate-fade-in-up">
					<h1 class="text-6xl font-bold mb-6 bg-primary text-transparent bg-clip-text">
						Your Spendcast Wrapped
					</h1>
					<p class="text-2xl text-gray-300 mb-12">2024 Financial Year in Review</p>

					<div class="relative w-32 h-32 mx-auto mb-8">
						<div class="absolute inset-0 rounded-full bg-primary animate-pulse"></div>
						<div class="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
							<span class="text-5xl">💸</span>
						</div>
					</div>

					<p class="text-xl text-gray-400 mb-16">Scroll through to see your spending insights</p>

					<button
						class="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/80 transition-all"
						onclick={nextSlide}
					>
						Get Started
					</button>
				</div>
			</div>
		{:else if currentSlide === 1}
			<!-- Slide 2: Total Spending -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Total Spending</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">Here's how much you spent in 2024</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="text-center mb-8">
							<span class="text-7xl font-bold text-white"
								>{formatCurrency(mockData.totalSpent)}</span
							>
							<p class="mt-4 text-gray-400">Across {mockData.totalTransactions} transactions</p>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
							<div class="bg-muted/50 p-6 rounded-lg border border-background/50">
								<p class="text-gray-400 mb-2">Biggest Month</p>
								<p class="text-2xl font-bold text-white">{mockData.biggestMonth.month}</p>
								<p class="text-xl text-blue-400">{formatCurrency(mockData.biggestMonth.amount)}</p>
							</div>

							<div class="bg-muted/50 p-6 rounded-lg border border-background/50">
								<p class="text-gray-400 mb-2">Top Category</p>
								<p class="text-2xl font-bold text-white">{mockData.topCategory.name}</p>
								<p class="text-xl text-green-400">{formatCurrency(mockData.topCategory.amount)}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 2}
			<!-- Slide 3: Monthly Breakdown -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Monthly Breakdown</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						Your spending patterns throughout the year
					</p>

					<Card.Root class="border-border bg-card/60 backdrop-blur-sm">
						<Card.Header>
							<Card.Title>Monthly Spending Patterns</Card.Title>
							<Card.Description>Your expenses and savings throughout 2024</Card.Description>
						</Card.Header>
						<Card.Content>
							<Chart.Container config={chartConfig}>
								<AreaChart
									data={chartData}
									x="date"
									xScale={scaleUtc()}
									axis="x"
									series={[
										{
											key: 'expenses',
											label: 'Expenses',
											color: chartConfig.expenses.color
										},
										{
											key: 'savings',
											label: 'Savings',
											color: chartConfig.savings.color
										}
									]}
									props={{
										area: {
											curve: curveNatural,
											'fill-opacity': 0.4,
											line: { class: 'stroke-1' },
											motion: 'tween'
										},
										xAxis: {
											format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short' })
										}
									}}
								>
									{#snippet tooltip()}
										<Chart.Tooltip
											labelFormatter={(v: Date) => {
												return v.toLocaleDateString('en-US', {
													month: 'long'
												});
											}}
											indicator="line"
										/>
									{/snippet}
								</AreaChart>
							</Chart.Container>
						</Card.Content>
						<Card.Footer>
							<div class="flex w-full items-start gap-2 text-sm">
								<div class="grid gap-2">
									<div class="flex items-center gap-2 font-medium leading-none">
										{mockData.biggestMonth.month} was your highest spending month
										<TrendingUpIcon class="size-4" />
									</div>
									<div class="text-muted-foreground flex items-center gap-2 leading-none">
										{formatCurrency(Math.max(...mockData.monthlySpending))}
									</div>
								</div>
							</div>
						</Card.Footer>
					</Card.Root>
				</div>
			</div>
		{:else if currentSlide === 3}
			<!-- Slide 4: Category Breakdown -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Spending by Category</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">Where your money went in 2024</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="space-y-6">
							{#each Object.entries(mockData.categorySpending) as [category, amount]}
								{@const totalSpent = mockData.totalSpent}
								{@const percentage = ((amount as number) / totalSpent) * 100}

								<div>
									<div class="flex justify-between mb-1">
										<span class="text-gray-200">{category}</span>
										<span class="text-gray-300"
											>{formatCurrency(amount as number)} ({percentage.toFixed(1)}%)</span
										>
									</div>
									<div class="h-3 w-full bg-background/50 rounded-full overflow-hidden">
										<div class="h-full bg-primary" style="width: {percentage}%"></div>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-8 pt-6 border-t border-border text-center">
							<p class="text-lg text-gray-300">Your top category was</p>
							<p class="text-2xl font-bold text-white mt-2">Housing</p>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 4}
			<!-- Slide 5: Biggest Expense -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Biggest Single Expense</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						Your most significant purchase of 2024
					</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="flex flex-col md:flex-row gap-8 items-center">
							<div
								class="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-yellow-700 flex items-center justify-center"
							>
								<span class="text-8xl">🏠</span>
							</div>

							<div class="flex-1 space-y-4">
								<div>
									<h3 class="text-2xl font-bold text-white">{mockData.biggestSpend.description}</h3>
									<p class="text-lg text-gray-400">{mockData.biggestSpend.category}</p>
								</div>

								<div class="text-4xl font-bold text-red-400">
									{formatCurrency(mockData.biggestSpend.amount)}
								</div>

								<div class="text-gray-300">
									{formatDate(mockData.biggestSpend.date)}
								</div>

								<div class="text-sm text-gray-400">
									This represents {formatPercent(
										Math.abs(mockData.biggestSpend.amount),
										mockData.totalSpent
									)} of your total yearly spending
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 5}
			<!-- Slide 6: Income vs Expenses -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-yellow-300">Income vs Expenses</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">How much you earned and spent</p>

					<Card.Root class="border-border bg-card/60 backdrop-blur-sm">
						<Card.Header class="items-center">
							<Card.Title>Financial Distribution</Card.Title>
							<Card.Description>Income and Expenses in 2024</Card.Description>
						</Card.Header>
						<Card.Content class="flex-1">
							<div class="space-y-6">
								<div>
									<p class="text-gray-400 mb-1">Total Income</p>
									<p class="text-3xl font-bold text-green-400">
										{formatCurrency(mockData.totalEarned)}
									</p>
								</div>

								<div>
									<p class="text-gray-400 mb-1">Total Expenses</p>
									<p class="text-3xl font-bold text-red-400">
										{formatCurrency(mockData.totalSpent)}
									</p>
								</div>

								<div>
									<p class="text-gray-400 mb-1">Net Savings</p>
									<p class="text-3xl font-bold text-blue-400">
										{formatCurrency(mockData.totalEarned - mockData.totalSpent)}
									</p>
								</div>
							</div>

							<div class="relative">
								<Chart.Container
									config={incomeExpensesConfig}
									class="mx-auto aspect-square w-full max-h-[250px]"
								>
									<PieChart
										data={incomeVsExpensesData}
										key="type"
										value="amount"
										c="color"
										innerRadius={60}
										padding={20}
									>
										{#snippet aboveMarks()}
											<Text
												value={formatCurrency(mockData.totalEarned - mockData.totalSpent)}
												textAnchor="middle"
												verticalAnchor="middle"
												class="fill-foreground text-sm font-bold"
												dy={-5}
											/>
											<Text
												value="Net Savings"
												textAnchor="middle"
												verticalAnchor="middle"
												class="fill-muted-foreground text-xs"
												dy={15}
											/>
										{/snippet}

										{#snippet tooltip()}
											<Chart.Tooltip hideLabel />
										{/snippet}
									</PieChart>
								</Chart.Container>
							</div>
						</Card.Content>
						<Card.Footer class="flex-col gap-2 text-sm">
							<div class="flex items-center gap-2 font-medium leading-none">
								{#if mockData.totalEarned > mockData.totalSpent}
									You saved {formatPercent(
										mockData.totalEarned - mockData.totalSpent,
										mockData.totalEarned
									)} of your income
									<TrendingUpIcon class="size-4" />
								{:else}
									Your expenses exceeded your income
								{/if}
							</div>
							<div class="text-muted-foreground leading-none">
								Saving 15-20% of income is recommended for financial health
							</div>
						</Card.Footer>
					</Card.Root>
				</div>
			</div>
		{:else if currentSlide === 6}
			<!-- Slide 7: Accounts Overview -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Your Accounts</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						Current balance across your accounts
					</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="space-y-6">
							{#each mockData.accounts as account}
								<div class="bg-muted/50 p-6 rounded-lg border border-background/50">
									<div class="flex justify-between items-start">
										<div>
											<h3 class="text-xl font-bold text-white">{account.account.name}</h3>
											<p class="text-gray-400">
												{account.account.type.charAt(0).toUpperCase() +
													account.account.type.slice(1)}
											</p>
										</div>
										<div class="text-right">
											<p class="text-2xl font-bold text-primary">
												{formatCurrency(account.account.currentBalance)}
											</p>
											<p class="text-sm text-gray-400">{account.transactionCount} transactions</p>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-8 pt-6 border-t border-border">
							<div class="flex justify-between items-center">
								<p class="text-lg text-gray-300">Total Balance</p>
								<p class="text-2xl font-bold text-white">
									{formatCurrency(
										mockData.accounts.reduce((sum, acc) => sum + acc.account.currentBalance, 0)
									)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 7}
			<!-- Slide 8: Savings Goals -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Savings Goals</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						Progress towards your financial goals
					</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="space-y-6">
							{#each mockData.savingsProfiles as savings}
								{@const percentage = (savings.currentAmount / savings.targetAmount) * 100}
								<div>
									<div class="flex justify-between mb-2">
										<div>
											<h3 class="text-lg font-medium text-white">{savings.name}</h3>
											<p class="text-sm text-gray-400">
												{savings.category.charAt(0).toUpperCase() + savings.category.slice(1)}
											</p>
										</div>
										<div class="text-right">
											<p class="text-lg font-medium text-white">
												{formatCurrency(savings.currentAmount)} / {formatCurrency(
													savings.targetAmount
												)}
											</p>
											<p class="text-sm text-gray-400">{percentage.toFixed(1)}% complete</p>
										</div>
									</div>

									<div class="h-3 w-full bg-background/50 rounded-full overflow-hidden">
										<div
											class="h-full bg-primary rounded-full transition-all duration-1000"
											style="width: {percentage}%"
										></div>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-8 pt-6 border-t border-border">
							<div class="text-center">
								<p class="text-lg text-gray-300">Total progress across all goals</p>
								<p class="text-2xl font-bold text-white mt-2">
									{formatCurrency(
										mockData.savingsProfiles.reduce((sum, goal) => sum + goal.currentAmount, 0)
									)} / {formatCurrency(
										mockData.savingsProfiles.reduce((sum, goal) => sum + goal.targetAmount, 0)
									)}
									<span class="text-green-400 ml-2"
										>({(
											(mockData.savingsProfiles.reduce((sum, goal) => sum + goal.currentAmount, 0) /
												mockData.savingsProfiles.reduce(
													(sum, goal) => sum + goal.targetAmount,
													0
												)) *
											100
										).toFixed(1)}%)</span
									>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 8}
			<!-- Slide 10: Financial Health -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-primary">Financial Health</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						How your finances compare to recommended benchmarks
					</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="space-y-8">
							<div>
								<div class="flex justify-between mb-1">
									<span class="text-white">Savings Rate</span>
									<span class="text-green-400">Good</span>
								</div>
								<div class="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
									<div class="h-full bg-green-500 rounded-full" style="width: 75%"></div>
								</div>
								<p class="text-xs text-gray-400 mt-1">
									You save {(
										((mockData.totalEarned - mockData.totalSpent) / mockData.totalEarned) *
										100
									).toFixed(0)}% of income (15-20% recommended)
								</p>
							</div>

							<div>
								<div class="flex justify-between mb-1">
									<span class="text-white">Emergency Fund</span>
									<span class="text-yellow-400">Fair</span>
								</div>
								<div class="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
									<div class="h-full bg-yellow-500 rounded-full" style="width: 60%"></div>
								</div>
								<p class="text-xs text-gray-400 mt-1">
									3 months of expenses (6+ months recommended)
								</p>
							</div>

							<div>
								<div class="flex justify-between mb-1">
									<span class="text-white">Housing Costs</span>
									<span class="text-green-400">Excellent</span>
								</div>
								<div class="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
									<div class="h-full bg-green-500 rounded-full" style="width: 90%"></div>
								</div>
								<p class="text-xs text-gray-400 mt-1">22% of income (below 30% recommended)</p>
							</div>

							<div>
								<div class="flex justify-between mb-1">
									<span class="text-white">Debt-to-Income</span>
									<span class="text-green-400">Excellent</span>
								</div>
								<div class="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
									<div class="h-full bg-green-500 rounded-full" style="width: 95%"></div>
								</div>
								<p class="text-xs text-gray-400 mt-1">15% (below 36% recommended)</p>
							</div>
						</div>

						<div class="mt-8 pt-6 border-t border-border">
							<div class="text-center">
								<p class="text-xl font-bold text-white">Overall Score</p>
								<div
									class="w-32 h-32 mx-auto mt-4 rounded-full border-8 border-green-500 flex items-center justify-center"
								>
									<span class="text-4xl font-bold text-green-400">A-</span>
								</div>
								<p class="mt-4 text-gray-300">Your finances are in good shape!</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 9}
			<!-- Slide 11: Recommendations -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up">
					<h2 class="text-4xl font-bold mb-2 text-center text-yellow-300">Recommendations</h2>
					<p class="text-xl text-gray-400 mb-12 text-center">
						Suggestions to improve your finances
					</p>

					<div class="bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border">
						<div class="space-y-6">
							<div class="flex gap-4">
								<div
									class="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center shrink-0"
								>
									<span class="text-yellow-400 text-lg">1</span>
								</div>
								<div>
									<h3 class="text-xl font-bold text-white mb-1">Increase Emergency Fund</h3>
									<p class="text-gray-300">
										Try to build your emergency fund to cover 6 months of expenses. You're currently
										at 3 months.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center shrink-0"
								>
									<span class="text-green-400 text-lg">2</span>
								</div>
								<div>
									<h3 class="text-xl font-bold text-white mb-1">
										Review Food & Groceries Spending
									</h3>
									<p class="text-gray-300">
										This is your highest spending category. Consider meal planning to reduce
										expenses.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0"
								>
									<span class="text-blue-400 text-lg">3</span>
								</div>
								<div>
									<h3 class="text-xl font-bold text-white mb-1">Automate More Savings</h3>
									<p class="text-gray-300">
										Set up automatic transfers to your savings goals to reach them faster.
									</p>
								</div>
							</div>

							<div class="flex gap-4">
								<div
									class="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0"
								>
									<span class="text-purple-400 text-lg">4</span>
								</div>
								<div>
									<h3 class="text-xl font-bold text-white mb-1">Review Weekend Spending</h3>
									<p class="text-gray-300">
										You tend to spend more on Saturdays. Consider setting a weekend budget.
									</p>
								</div>
							</div>
						</div>

						<div class="mt-8 pt-6 border-t border-border text-center">
							<p class="text-lg text-gray-300">
								Taking these steps could improve your financial health by <span
									class="text-yellow-400 font-medium">15%</span
								> next year
							</p>
						</div>
					</div>
				</div>
			</div>
		{:else if currentSlide === 10}
			<!-- Slide 12: Conclusion -->
			<div class="max-w-4xl w-full p-8">
				<div class="animate-fade-in-up text-center">
					<h2 class="text-4xl font-bold mb-2 text-center bg-primary text-transparent bg-clip-text">
						Your 2024 Financial Journey
					</h2>
					<p class="text-xl text-gray-400 mb-12">Thanks for using Spendcast</p>

					<div class="w-32 h-32 mx-auto mb-8 relative">
						<div class="absolute inset-0 rounded-full bg-primary animate-pulse"></div>
						<div class="absolute inset-2 rounded-full bg-gray-900 flex items-center justify-center">
							<span class="text-5xl">🚀</span>
						</div>
					</div>

					<div
						class="max-w-lg mx-auto bg-card p-8 rounded-xl shadow-xl backdrop-blur-sm border border-border"
					>
						<p class="text-gray-300 mb-6">
							You've managed your finances well this year! Continue building on your good habits and
							work on the recommendations to make next year even better.
						</p>

						<p class="text-lg font-medium text-white mb-8">
							See you in 2025 for your next financial wrap-up!
						</p>

						<button
							class="px-6 py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary/80 transition-all"
							onclick={() => goToSlide(0)}
						>
							<Confetti />
							Start Over
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.animate-fade-in-up {
		animation: fadeInUp 0.8s ease forwards;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
