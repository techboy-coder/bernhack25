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
	import { createQuery } from '@tanstack/svelte-query';
	import { getRecurrentPayments } from '$lib/api';
	import { Calendar, DollarSign, Zap, Clock, AlertCircle, Edit, Trash2 } from 'lucide-svelte';

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

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
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

	function getNextPaymentDate(payment: RecurrentPayment): string {
		const startDate = new Date(payment.startDate);
		const now = new Date();

		// Simple calculation for demo
		const daysSinceStart = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		let cycleDays = 30;

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
		const nextDate = new Date(now.getTime() + nextPaymentDays * 24 * 60 * 60 * 1000);

		return formatDate(nextDate.toISOString());
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

	function isExpired(payment: RecurrentPayment): boolean {
		return payment.endDate ? new Date(payment.endDate) < new Date() : false;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">💳 All Recurring Payments</h2>
		<p class="text-muted-foreground">
			Manage and overview all your recurring payments and subscriptions
		</p>
	</div>

	{#if $paymentsQuery.isLoading}
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-3">
			{#each Array(8) as _}
				<Card>
					<CardContent class="p-4">
						<div class="animate-pulse space-y-3">
							<div class="h-4 bg-muted rounded w-2/3"></div>
							<div class="h-6 bg-muted rounded w-1/2"></div>
							<div class="h-3 bg-muted rounded w-full"></div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if $paymentsQuery.isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<AlertCircle class="size-12 text-destructive mx-auto" />
					<h3 class="font-semibold text-destructive">Error Loading Payments</h3>
					<p class="text-sm text-muted-foreground">Failed to load recurring payments data.</p>
				</div>
			</CardContent>
		</Card>
	{:else if recurrentPayments.length === 0}
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
	{:else}
		<!-- Payments Grid -->
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
			{#each recurrentPayments as payment}
				{@const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency)}
				{@const nextPayment = getNextPaymentDate(payment)}
				{@const expired = isExpired(payment)}

				<Card class="transition-all hover:shadow-lg {expired ? 'opacity-60' : ''}">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-2">
								<span class="text-xl">{getCategoryIcon(payment.category)}</span>
								<div class="min-w-0 flex-1">
									<CardTitle class="text-base truncate">{payment.name}</CardTitle>
									<CardDescription class="capitalize">{payment.category}</CardDescription>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<Button size="sm" variant="ghost" class="size-8 p-0">
									<Edit class="size-4" />
								</Button>
								<Button size="sm" variant="ghost" class="size-8 p-0 text-red-500">
									<Trash2 class="size-4" />
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-3">
						<!-- Amount and Frequency -->
						<div class="space-y-2">
							<div class="text-xl font-bold">
								{formatCurrency(payment.amount)}
							</div>
							<div class="text-sm text-muted-foreground">
								per {payment.frequency}
								{#if payment.frequency !== 'monthly'}
									<span class="block">≈ {formatCurrency(monthlyAmount)}/month</span>
								{/if}
							</div>
						</div>

						<!-- Next Payment / Status -->
						<div class="space-y-1">
							<p class="text-xs text-muted-foreground uppercase tracking-wide">
								{expired ? 'Status' : 'Next Payment'}
							</p>
							{#if expired}
								<Badge variant="destructive" class="text-xs">Expired</Badge>
							{:else}
								<p class="text-sm font-medium">{nextPayment}</p>
							{/if}
						</div>

						<!-- Auto Pay Status -->
						<div class="flex items-center justify-between pt-2 border-t">
							<div class="flex items-center gap-1 text-xs text-muted-foreground">
								{#if payment.autoPay}
									<Zap class="size-4 text-green-500" />
									<span class="text-green-600">Auto Pay</span>
								{:else}
									<Clock class="size-4 text-yellow-500" />
									<span class="text-yellow-600">Manual</span>
								{/if}
							</div>
							<div class="text-xs text-muted-foreground">
								Since {formatDate(payment.startDate)}
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
