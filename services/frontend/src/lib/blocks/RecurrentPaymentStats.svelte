<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { createQuery } from '@tanstack/svelte-query';
	import { getRecurrentPayments } from '$lib/api';
	import {
		Calendar,
		DollarSign,
		TrendingUp,
		Zap,
		Clock,
		AlertCircle,
		CheckCircle
	} from 'lucide-svelte';

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
		staleTime: 1000 * 60 * 5 // 5 minutes
	});

	// Derived calculations
	let recurrentPayments = $derived(($paymentsQuery.data as RecurrentPayment[]) || []);

	let totalMonthlyAmount = $derived(
		recurrentPayments.reduce((sum, payment) => {
			const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency);
			return sum + monthlyAmount;
		}, 0)
	);

	let activePayments = $derived(
		recurrentPayments.filter(
			(payment) => !payment.endDate || new Date(payment.endDate) > new Date()
		).length
	);

	let autoPayments = $derived(recurrentPayments.filter((payment) => payment.autoPay).length);

	let upcomingPayments = $derived(
		recurrentPayments
			.map((payment) => ({ ...payment, daysUntil: getDaysUntilNext(payment) }))
			.filter((payment) => payment.daysUntil <= 7).length
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

	function calculateMonthlyAmount(amount: number, frequency: string): number {
		switch (frequency) {
			case 'weekly':
				return amount * 4.33; // Average weeks per month
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

	function getDaysUntilNext(payment: RecurrentPayment): number {
		const startDate = new Date(payment.startDate);
		const now = new Date();

		// Simple calculation - for demo purposes
		const daysSinceStart = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		let cycleDays = 30; // monthly default
		switch (payment.frequency) {
			case 'weekly':
				cycleDays = 7;
				break;
			case 'monthly':
				cycleDays = 30;
				break;
			case 'quarterly':
				cycleDays = 90;
				break;
			case 'yearly':
				cycleDays = 365;
				break;
		}

		const nextPaymentDays = cycleDays - (daysSinceStart % cycleDays);
		return nextPaymentDays;
	}

	function getCategoryBreakdown() {
		const breakdown = new Map<string, number>();
		recurrentPayments.forEach((payment) => {
			const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency);
			breakdown.set(payment.category, (breakdown.get(payment.category) || 0) + monthlyAmount);
		});
		return Array.from(breakdown.entries()).sort(([, a], [, b]) => b - a);
	}

	let categoryBreakdown = $derived(getCategoryBreakdown());
	let isLoading = $derived($paymentsQuery.isLoading);
	let isError = $derived($paymentsQuery.isError);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">💳 Recurrent Payment Statistics</h2>
		<p class="text-muted-foreground">
			Overview of your recurring payments and subscription management
		</p>
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="flex flex-col items-center gap-4">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				<p class="text-sm text-muted-foreground">Loading payment statistics...</p>
			</div>
		</div>
	{:else if isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<AlertCircle class="size-12 text-destructive mx-auto" />
					<h3 class="font-semibold text-destructive">Error Loading Statistics</h3>
					<p class="text-sm text-muted-foreground">
						Failed to load recurrent payment data. Please try refreshing the page.
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
						<CardTitle class="text-sm font-medium">Monthly Total</CardTitle>
						<DollarSign class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold">{formatCurrency(totalMonthlyAmount)}</div>
					<p class="text-xs text-muted-foreground">
						{formatCurrency(totalMonthlyAmount * 12)} per year
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Active Payments</CardTitle>
						<CheckCircle class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold">{activePayments}</div>
					<p class="text-xs text-muted-foreground">
						{recurrentPayments.length - activePayments} expired
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Auto Pay</CardTitle>
						<Zap class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold">{autoPayments}</div>
					<p class="text-xs text-muted-foreground">
						{activePayments - autoPayments} manual payments
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-6">
					<div class="flex items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">Due This Week</CardTitle>
						<Clock class="size-4 text-muted-foreground" />
					</div>
					<div class="text-2xl font-bold">{upcomingPayments}</div>
					<p class="text-xs text-muted-foreground">Next 7 days</p>
				</CardContent>
			</Card>
		</div>

		<!-- Category Breakdown -->
		{#if categoryBreakdown.length > 0}
			<Card>
				<CardHeader>
					<CardTitle>Spending by Category</CardTitle>
					<CardDescription>Monthly breakdown of recurring payments</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#each categoryBreakdown as [category, amount]}
						{@const percentage = totalMonthlyAmount > 0 ? (amount / totalMonthlyAmount) * 100 : 0}

						<div class="space-y-2">
							<div class="flex justify-between items-center">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium capitalize">{category}</span>
								</div>
								<div class="text-right">
									<div class="text-sm font-bold">{formatCurrency(amount)}</div>
									<div class="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
								</div>
							</div>
							<Progress value={percentage} class="h-2" />
						</div>
					{/each}
				</CardContent>
			</Card>
		{/if}

		{#if recurrentPayments.length === 0}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-12">
					<Calendar class="size-12 text-muted-foreground mb-4" />
					<h3 class="text-xl font-medium mb-2">No Recurring Payments</h3>
					<p class="text-muted-foreground text-center max-w-md">
						You don't have any recurring payments set up yet. Add your subscriptions and regular
						payments to track them here.
					</p>
				</CardContent>
			</Card>
		{/if}
	{/if}
</div>
