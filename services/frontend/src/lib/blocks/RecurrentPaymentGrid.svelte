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
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import {
		getRecurrentPayments,
		createRecurrentPayment,
		updateRecurrentPayment,
		deleteRecurrentPayment
	} from '$lib/api';
	import {
		Calendar,
		DollarSign,
		Zap,
		Clock,
		AlertCircle,
		Edit,
		Trash2,
		Plus,
		Loader2
	} from 'lucide-svelte';
	import {
		Sheet,
		SheetContent,
		SheetDescription,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Switch } from '$lib/components/ui/switch';

	interface RecurrentPayment {
		id: string;
		amount: number;
		name: string;
		category: string;
		frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
		startDate: string;
		endDate?: string;
		autoPay: boolean;
		savingsProfile?: string;
	}

	// Query for recurrent payments
	const paymentsQuery = createQuery({
		queryKey: ['recurrentPayments'],
		queryFn: () => getRecurrentPayments(),
		staleTime: 1000 * 60 * 5 // 5 minutes
	});

	// State management
	let isSheetOpen = $state(false);
	let isEditing = $state(false);
	let editingPayment: RecurrentPayment | null = $state(null);
	let formData = $state({
		name: '',
		amount: 0,
		category: '',
		frequency: 'monthly' as RecurrentPayment['frequency'],
		startDate: '',
		endDate: '',
		autoPay: false,
		savingsProfile: ''
	});
	let error = $state('');

	// TanStack Query setup
	const queryClient = useQueryClient();

	// Mutation for creating a new payment
	const createPaymentMutation = createMutation({
		mutationFn: createRecurrentPayment,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['recurrentPayments'] });
			isSheetOpen = false;
			resetForm();
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to create recurrent payment';
		}
	});

	// Mutation for updating a payment
	const updatePaymentMutation = createMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<RecurrentPayment> }) =>
			updateRecurrentPayment(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['recurrentPayments'] });
			isSheetOpen = false;
			resetForm();
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to update recurrent payment';
		}
	});

	// Mutation for deleting a payment
	const deletePaymentMutation = createMutation({
		mutationFn: (id: string) => deleteRecurrentPayment(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['recurrentPayments'] });
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to delete recurrent payment';
		}
	});

	// Categories with icons and descriptions
	const categories = [
		{ value: 'housing', icon: '🏠', description: 'Rent, mortgage, utilities' },
		{ value: 'food', icon: '🍽️', description: 'Groceries, dining, meal plans' },
		{ value: 'transport', icon: '🚗', description: 'Car payments, insurance, transit passes' },
		{ value: 'entertainment', icon: '🎬', description: 'Streaming, subscriptions, hobbies' },
		{ value: 'education', icon: '📚', description: 'Courses, books, tuition' },
		{ value: 'healthcare', icon: '🏥', description: 'Insurance, medications, treatments' },
		{ value: 'travel', icon: '✈️', description: 'Transportation, accommodation' },
		{ value: 'shopping', icon: '🛍️', description: 'Regular purchases, memberships' },
		{ value: 'utilities', icon: '💡', description: 'Electricity, water, internet, phone' },
		{ value: 'other', icon: '💰', description: 'Other recurring expenses' }
	];

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

	function resetForm() {
		formData = {
			name: '',
			amount: 0,
			category: '',
			frequency: 'monthly',
			startDate: '',
			endDate: '',
			autoPay: false,
			savingsProfile: ''
		};
		isEditing = false;
		editingPayment = null;
		error = '';
	}

	function openCreateSheet() {
		resetForm();
		formData.startDate = new Date().toISOString().split('T')[0];
		isSheetOpen = true;
	}

	function openEditSheet(payment: RecurrentPayment) {
		formData = {
			name: payment.name,
			amount: payment.amount,
			category: payment.category,
			frequency: payment.frequency,
			startDate: payment.startDate.split('T')[0],
			endDate: payment.endDate ? payment.endDate.split('T')[0] : '',
			autoPay: payment.autoPay,
			savingsProfile: payment.savingsProfile || ''
		};
		isEditing = true;
		editingPayment = payment;
		isSheetOpen = true;
	}

	function handleSubmit() {
		if (!formData.name.trim() || formData.amount <= 0 || !formData.category) {
			error = 'Please fill in all required fields';
			return;
		}

		const paymentData = {
			name: formData.name.trim(),
			amount: formData.amount,
			category: formData.category,
			frequency: formData.frequency,
			startDate: formData.startDate,
			endDate: formData.endDate || undefined,
			autoPay: formData.autoPay,
			savingsProfile: formData.savingsProfile || undefined
		};

		if (isEditing && editingPayment) {
			$updatePaymentMutation.mutate({ id: editingPayment.id, data: paymentData });
		} else {
			$createPaymentMutation.mutate(paymentData);
		}
	}

	function handleDelete(paymentId: string, paymentName: string) {
		if (
			confirm(`Are you sure you want to delete "${paymentName}"? This action cannot be undone.`)
		) {
			$deletePaymentMutation.mutate(paymentId);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header with Add Button -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">💳 All Recurring Payments</h2>
			<p class="text-muted-foreground">
				Manage and overview all your recurring payments and subscriptions
			</p>
		</div>

		<Sheet bind:open={isSheetOpen}>
			<SheetTrigger>
				<Button onclick={openCreateSheet} class="gap-2">
					<Plus class="size-4" />
					New Payment
				</Button>
			</SheetTrigger>
			<SheetContent class="w-full sm:max-w-md p-6">
				<SheetHeader class="p-0">
					<SheetTitle>
						{isEditing ? 'Edit Recurrent Payment' : 'Create New Recurrent Payment'}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? 'Update your recurring payment details and settings.'
							: 'Set up a new recurring payment to automate your finances.'}
					</SheetDescription>
				</SheetHeader>

				<div class="grid gap-6 py-6">
					<!-- Payment Name -->
					<div class="space-y-2">
						<Label for="name">Payment Name *</Label>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder="e.g., Netflix, Rent, Internet"
							required
						/>
					</div>

					<!-- Amount -->
					<div class="space-y-2">
						<Label for="amount">Amount (CHF) *</Label>
						<Input
							id="amount"
							type="number"
							bind:value={formData.amount}
							min="1"
							step="1"
							placeholder="100"
							required
						/>
					</div>

					<!-- Category -->
					<div class="space-y-2">
						<Label for="category">Category *</Label>
						<select
							bind:value={formData.category}
							id="category"
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							required
						>
							<option value="">Select a category</option>
							{#each categories as category}
								<option value={category.value}>
									{category.icon}
									{category.value.charAt(0).toUpperCase() + category.value.slice(1)} - {category.description}
								</option>
							{/each}
						</select>
					</div>

					<!-- Frequency -->
					<div class="space-y-2">
						<Label for="frequency">Frequency *</Label>
						<select
							bind:value={formData.frequency}
							id="frequency"
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							required
						>
							<option value="weekly">Weekly</option>
							<option value="monthly">Monthly</option>
							<option value="quarterly">Quarterly</option>
							<option value="yearly">Yearly</option>
						</select>
					</div>

					<!-- Start Date -->
					<div class="space-y-2">
						<Label for="start-date">Start Date *</Label>
						<Input id="start-date" type="date" bind:value={formData.startDate} required />
					</div>

					<!-- End Date -->
					<div class="space-y-2">
						<Label for="end-date">End Date (Optional)</Label>
						<Input
							id="end-date"
							type="date"
							bind:value={formData.endDate}
							min={formData.startDate}
						/>
						<p class="text-xs text-muted-foreground">Leave empty for ongoing payments</p>
					</div>

					<!-- Auto Pay Toggle -->
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<Label for="autopay">Enable Auto Pay</Label>
							<p class="text-xs text-muted-foreground">Automatically process payments when due</p>
						</div>
						<Switch id="autopay" bind:checked={formData.autoPay} />
					</div>

					{#if error}
						<Alert variant="destructive">
							<AlertCircle class="size-5" />
							<AlertTitle>Error</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					{/if}

					<div class="flex gap-3 pt-4">
						<Button
							onclick={handleSubmit}
							disabled={$createPaymentMutation.isPending || $updatePaymentMutation.isPending}
							class="flex-1 gap-2"
						>
							{#if $createPaymentMutation.isPending || $updatePaymentMutation.isPending}
								<Loader2 class="size-5 animate-spin" />
								{isEditing ? 'Updating...' : 'Creating...'}
							{:else}
								{isEditing ? 'Update Payment' : 'Create Payment'}
							{/if}
						</Button>
						<Button variant="outline" onclick={() => (isSheetOpen = false)}>Cancel</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
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
								<Button
									size="sm"
									variant="ghost"
									class="size-8 p-0"
									onclick={() => openEditSheet(payment)}
									disabled={$deletePaymentMutation.isPending}
								>
									<Edit class="size-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									class="size-8 p-0 text-red-500 hover:text-red-600"
									onclick={() => handleDelete(payment.id, payment.name)}
									disabled={$deletePaymentMutation.isPending}
								>
									{#if $deletePaymentMutation.isPending && $deletePaymentMutation.variables === payment.id}
										<Loader2 class="size-4 animate-spin" />
									{:else}
										<Trash2 class="size-4" />
									{/if}
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
