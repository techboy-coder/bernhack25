<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { createQuery } from '@tanstack/svelte-query';
	import { getRecurrentPayments } from '$lib/api';
	import { Calendar, Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-svelte';

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

	let { daysAhead = 30 }: { daysAhead?: number } = $props();

	// Query for recurrent payments
	const paymentsQuery = createQuery({
		queryKey: ['recurrentPayments'],
		queryFn: () => getRecurrentPayments(),
		staleTime: 1000 * 60 * 5
	});

	// Calculate upcoming payments
	let upcomingPayments = $derived(() => {
		const payments = ($paymentsQuery.data as RecurrentPayment[]) || [];
		const now = new Date();
		const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

		const upcoming = payments
			.filter((payment) => !payment.endDate || new Date(payment.endDate) > now)
			.map((payment) => {
				const nextDate = getNextPaymentDate(payment);
				const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

				return {
					...payment,
					nextDate,
					daysUntil,
					isOverdue: daysUntil < 0,
					isDueToday: daysUntil === 0,
					isDueSoon: daysUntil <= 3 && daysUntil > 0
				};
			})
			.filter((payment) => payment.nextDate <= endDate)
			.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

		return upcoming;
	});

	// Group payments by time period
	let groupedPayments = $derived(() => {
		const groups = {
			overdue: upcomingPayments().filter((p) => p.isOverdue),
			today: upcomingPayments().filter((p) => p.isDueToday),
			soon: upcomingPayments().filter((p) => p.isDueSoon),
			upcoming: upcomingPayments().filter((p) => p.daysUntil > 3)
		};
		return groups;
	});

	// Helper functions
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-CH', {
			style: 'currency',
			currency: 'CHF',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getNextPaymentDate(payment: RecurrentPayment): Date {
		const startDate = new Date(payment.startDate);
		const now = new Date();

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

		const daysSinceStart = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		const nextPaymentDays = cycleDays - (daysSinceStart % cycleDays);

		return new Date(now.getTime() + nextPaymentDays * 24 * 60 * 60 * 1000);
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

	function getDaysUntilText(daysUntil: number): string {
		if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`;
		if (daysUntil === 0) return 'Due today';
		if (daysUntil === 1) return 'Due tomorrow';
		return `Due in ${daysUntil} days`;
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="space-y-2">
		<h2 class="text-2xl font-bold tracking-tight">📅 Upcoming Payments</h2>
		<p class="text-muted-foreground">
			Your payment schedule for the next {daysAhead} days
		</p>
	</div>

	{#if $paymentsQuery.isLoading}
		<div class="space-y-4">
			{#each Array(5) as _}
				<Card>
					<CardContent class="p-4">
						<div class="animate-pulse space-y-2">
							<div class="flex items-center gap-3">
								<div class="h-6 w-6 bg-muted rounded"></div>
								<div class="h-4 bg-muted rounded flex-1"></div>
								<div class="h-4 bg-muted rounded w-16"></div>
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else if $paymentsQuery.isError}
		<Card class="border-destructive">
			<CardContent class="p-6">
				<div class="text-center space-y-2">
					<Calendar class="size-12 text-destructive mx-auto" />
					<h3 class="font-semibold text-destructive">Error Loading Payments</h3>
					<p class="text-sm text-muted-foreground">Failed to load upcoming payments.</p>
				</div>
			</CardContent>
		</Card>
	{:else if upcomingPayments().length === 0}
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12">
				<CheckCircle2 class="size-12 text-green-500 mb-4" />
				<h3 class="text-xl font-medium mb-2">All Caught Up!</h3>
				<p class="text-muted-foreground text-center max-w-md">
					No payments due in the next {daysAhead} days. You're all set!
				</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Payment Groups -->
		<div class="space-y-6">
			<!-- Overdue Payments -->
			{#if groupedPayments().overdue.length > 0}
				<Card class="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50">
					<CardHeader class="pb-3">
						<div class="flex items-center gap-2">
							<AlertTriangle class="size-5 text-red-600" />
							<CardTitle class="text-red-700 dark:text-red-300">Overdue Payments</CardTitle>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each groupedPayments().overdue as payment}
							<div
								class="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
							>
								<div class="flex items-center gap-3">
									<span class="text-lg">{getCategoryIcon(payment.category)}</span>
									<div>
										<p class="font-medium">{payment.name}</p>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<span class="capitalize">{payment.category}</span>
											{#if payment.autoPay}
												<Badge variant="secondary" class="text-xs gap-1">
													<Zap class="size-3" />
													Auto
												</Badge>
											{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<p class="font-bold text-red-600">{formatCurrency(payment.amount)}</p>
									<p class="text-xs text-red-500">{getDaysUntilText(payment.daysUntil)}</p>
								</div>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Due Today -->
			{#if groupedPayments().today.length > 0}
				<Card
					class="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50"
				>
					<CardHeader class="pb-3">
						<div class="flex items-center gap-2">
							<Clock class="size-5 text-orange-600" />
							<CardTitle class="text-orange-700 dark:text-orange-300">Due Today</CardTitle>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each groupedPayments().today as payment}
							<div
								class="flex items-center justify-between p-3 bg-white dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
							>
								<div class="flex items-center gap-3">
									<span class="text-lg">{getCategoryIcon(payment.category)}</span>
									<div>
										<p class="font-medium">{payment.name}</p>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<span class="capitalize">{payment.category}</span>
											{#if payment.autoPay}
												<Badge variant="secondary" class="text-xs gap-1">
													<Zap class="size-3" />
													Auto
												</Badge>
											{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<p class="font-bold text-orange-600">{formatCurrency(payment.amount)}</p>
									<p class="text-xs text-orange-500">Due today</p>
								</div>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Due Soon -->
			{#if groupedPayments().soon.length > 0}
				<Card
					class="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50"
				>
					<CardHeader class="pb-3">
						<div class="flex items-center gap-2">
							<Clock class="size-5 text-yellow-600" />
							<CardTitle class="text-yellow-700 dark:text-yellow-300">Due Soon</CardTitle>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each groupedPayments().soon as payment}
							<div
								class="flex items-center justify-between p-3 bg-white dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
							>
								<div class="flex items-center gap-3">
									<span class="text-lg">{getCategoryIcon(payment.category)}</span>
									<div>
										<p class="font-medium">{payment.name}</p>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<span class="capitalize">{payment.category}</span>
											{#if payment.autoPay}
												<Badge variant="secondary" class="text-xs gap-1">
													<Zap class="size-3" />
													Auto
												</Badge>
											{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<p class="font-bold text-yellow-600">{formatCurrency(payment.amount)}</p>
									<p class="text-xs text-yellow-500">{getDaysUntilText(payment.daysUntil)}</p>
								</div>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Upcoming -->
			{#if groupedPayments().upcoming.length > 0}
				<Card>
					<CardHeader class="pb-3">
						<div class="flex items-center gap-2">
							<Calendar class="size-5 text-muted-foreground" />
							<CardTitle>Upcoming Payments</CardTitle>
						</div>
					</CardHeader>
					<CardContent class="space-y-3">
						{#each groupedPayments().upcoming as payment}
							<div class="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
								<div class="flex items-center gap-3">
									<span class="text-lg">{getCategoryIcon(payment.category)}</span>
									<div>
										<p class="font-medium">{payment.name}</p>
										<div class="flex items-center gap-2 text-sm text-muted-foreground">
											<span class="capitalize">{payment.category}</span>
											{#if payment.autoPay}
												<Badge variant="secondary" class="text-xs gap-1">
													<Zap class="size-3" />
													Auto
												</Badge>
											{/if}
										</div>
									</div>
								</div>
								<div class="text-right">
									<p class="font-bold">{formatCurrency(payment.amount)}</p>
									<p class="text-xs text-muted-foreground">{formatDate(payment.nextDate)}</p>
								</div>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}
		</div>
	{/if}
</div>
