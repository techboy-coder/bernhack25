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
	import { Separator } from '$lib/components/ui/separator';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Switch } from '$lib/components/ui/switch';
	import {
		Calendar,
		Plus,
		CreditCard,
		TrendingDown,
		Clock,
		Edit,
		Trash2,
		Loader2,
		AlertCircle,
		CheckCircle,
		Zap,
		Home,
		Utensils,
		Car,
		Gamepad2,
		GraduationCap,
		Stethoscope,
		Plane,
		ShoppingBag
	} from 'lucide-svelte';

	// Import TanStack Query hooks and API functions
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import {
		getRecurrentPayments,
		createRecurrentPayment,
		updateRecurrentPayment,
		deleteRecurrentPayment
	} from '$lib/api';

	// Types
	interface RecurrentPayment {
		id: string;
		amount: number;
		name: string;
		category:
			| 'other'
			| 'food'
			| 'groceries'
			| 'transport'
			| 'housing'
			| 'utilities'
			| 'healthcare'
			| 'entertainment'
			| 'education'
			| 'shopping'
			| 'travel';
		frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
		startDate: string;
		endDate?: string;
		autoPay: boolean;
		savingsProfile?: string;
	}

	interface BankAccount {
		account: {
			id: string;
			name: string;
			type: string;
			currentBalance: number;
			currency: string;
		};
	}

	interface PageData {
		recurrentPayments: RecurrentPayment[];
		bankAccounts: BankAccount[];
		error?: string;
	}

	let { data }: { data: PageData } = $props();

	// State management
	let isSheetOpen = $state(false);
	let isEditing = $state(false);
	let editingPayment: RecurrentPayment | null = $state(null);
	let activeTab = $state('overview');
	let formData = $state({
		name: '',
		amount: 0,
		category: '' as RecurrentPayment['category'] | '',
		frequency: 'monthly' as RecurrentPayment['frequency'],
		startDate: '',
		endDate: '',
		autoPay: false,
		savingsProfile: ''
	});
	let error = $state('');

	// TanStack Query setup
	const queryClient = useQueryClient();

	// Query for fetching all recurrent payments
	const paymentsQuery = createQuery({
		queryKey: ['recurrentPayments'],
		queryFn: () => getRecurrentPayments(),
		initialData: data.recurrentPayments,
		staleTime: 1000 * 60 // 1 minute
	});

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
		{ value: 'housing', icon: Home, description: 'Rent, mortgage, utilities' },
		{ value: 'food', icon: Utensils, description: 'Groceries, dining, meal plans' },
		{ value: 'transport', icon: Car, description: 'Car payments, insurance, transit passes' },
		{ value: 'entertainment', icon: Gamepad2, description: 'Streaming, subscriptions, hobbies' },
		{ value: 'education', icon: GraduationCap, description: 'Courses, books, tuition' },
		{ value: 'healthcare', icon: Stethoscope, description: 'Insurance, medications, treatments' },
		{ value: 'travel', icon: Plane, description: 'Transportation, accommodation' },
		{ value: 'shopping', icon: ShoppingBag, description: 'Regular purchases, memberships' },
		{ value: 'utilities', icon: Zap, description: 'Electricity, water, internet, phone' },
		{ value: 'other', icon: CreditCard, description: 'Other recurring expenses' }
	];

	// Derived calculations
	let recurrentPayments: RecurrentPayment[] = $derived($paymentsQuery.data || []);
	let totalMonthlyAmount: number = $derived(
		recurrentPayments.reduce((sum, payment) => {
			const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency);
			return sum + monthlyAmount;
		}, 0)
	);
	let activePayments: number = $derived(
		recurrentPayments.filter(
			(payment) => !payment.endDate || new Date(payment.endDate) > new Date()
		).length
	);
	let autoPayments: number = $derived(
		recurrentPayments.filter((payment) => payment.autoPay).length
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

	function getFrequencyColor(frequency: string): string {
		switch (frequency) {
			case 'weekly':
				return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
			case 'monthly':
				return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
			case 'quarterly':
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
			case 'yearly':
				return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
			default:
				return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
		}
	}

	function getCategoryIcon(category: string) {
		const cat = categories.find((c) => c.value === category);
		return cat?.icon || CreditCard;
	}

	function getNextPaymentDate(payment: RecurrentPayment): string {
		const startDate = new Date(payment.startDate);
		const now = new Date();

		// Set time to start of day to avoid time zone issues
		now.setHours(0, 0, 0, 0);
		startDate.setHours(0, 0, 0, 0);

		let nextDate = new Date(startDate);

		switch (payment.frequency) {
			case 'weekly':
				while (nextDate <= now) {
					nextDate.setDate(nextDate.getDate() + 7);
				}
				break;

			case 'monthly':
				// Start from current year/month but use the original day
				nextDate = new Date(now.getFullYear(), now.getMonth(), startDate.getDate());

				// Handle edge case where the day doesn't exist in current month (e.g., Jan 31 -> Feb 31)
				if (nextDate.getDate() !== startDate.getDate()) {
					// Go to last day of the month
					nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
				}

				// If this date has already passed, move to next month
				if (nextDate <= now) {
					nextDate = new Date(now.getFullYear(), now.getMonth() + 1, startDate.getDate());

					// Handle edge case again
					if (nextDate.getDate() !== startDate.getDate()) {
						nextDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
					}
				}
				break;

			case 'quarterly':
				// Find the next quarter that contains a valid payment date
				const startMonth = startDate.getMonth();
				const startDay = startDate.getDate();

				// Calculate which quarter the start month belongs to and the months in that quarter pattern
				const quarterStartMonth = Math.floor(startMonth / 3) * 3;
				const monthsInPattern = [
					quarterStartMonth,
					quarterStartMonth + 3,
					quarterStartMonth + 6,
					quarterStartMonth + 9
				];

				// Find next valid month
				let foundValidDate = false;
				for (let i = 0; i < 12 && !foundValidDate; i++) {
					// Max 12 iterations to avoid infinite loop
					for (const month of monthsInPattern) {
						const testDate = new Date(
							now.getFullYear(),
							(month + Math.floor(i / 4) * 12) % 12,
							startDay
						);

						// Handle year rollover
						if (month + Math.floor(i / 4) * 12 >= 12) {
							testDate.setFullYear(
								now.getFullYear() + Math.floor((month + Math.floor(i / 4) * 12) / 12)
							);
						}

						// Handle invalid dates (like Feb 30)
						if (testDate.getDate() !== startDay) {
							testDate.setDate(0); // Go to last day of previous month, then add 1
							testDate.setDate(testDate.getDate() + 1);
						}

						if (testDate > now) {
							nextDate = testDate;
							foundValidDate = true;
							break;
						}
					}
				}
				break;

			case 'yearly':
				// Start with current year
				nextDate = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());

				// Handle leap year edge case (Feb 29)
				if (nextDate.getDate() !== startDate.getDate()) {
					nextDate = new Date(now.getFullYear(), startDate.getMonth() + 1, 0); // Last day of the month
				}

				// If this date has already passed this year, move to next year
				if (nextDate <= now) {
					nextDate = new Date(now.getFullYear() + 1, startDate.getMonth(), startDate.getDate());

					// Handle leap year edge case again
					if (nextDate.getDate() !== startDate.getDate()) {
						nextDate = new Date(now.getFullYear() + 1, startDate.getMonth() + 1, 0);
					}
				}
				break;
		}

		return nextDate.toISOString().split('T')[0];
	}

	function getDaysUntilNext(payment: RecurrentPayment): number {
		const nextDate = new Date(getNextPaymentDate(payment));
		const today = new Date();

		// Set both dates to start of day to avoid time zone issues
		nextDate.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);

		const diffTime = nextDate.getTime() - today.getTime();
		const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		// Ensure we never return negative days
		return Math.max(0, days);
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

	// Handle loading and error states
	let isLoading: boolean = $derived($paymentsQuery.isLoading);
	let isError: boolean = $derived($paymentsQuery.isError);
	let errorMessage: string = $derived(
		$paymentsQuery.error?.message || 'Failed to load recurrent payments'
	);
</script>

<svelte:head>
	<title>Recurrent Payments - Financial Management</title>
</svelte:head>

<div class="flex-1 space-y-6 p-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h1 class="text-3xl font-bold tracking-tight text-foreground">🔄 Recurrent Payments</h1>
			<p class="text-muted-foreground">
				Manage your recurring payments and automate your financial commitments
			</p>
		</div>

		<Sheet bind:open={isSheetOpen}>
			<SheetTrigger>
				<Button onclick={openCreateSheet} class="gap-2">
					<Plus class="size-5" />
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
							placeholder="e.g., Netflix Subscription, Monthly Rent"
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
							min="0.01"
							step="0.01"
							placeholder="29.90"
							required
						/>
					</div>

					<!-- Category -->
					<div class="space-y-2">
						<Label for="category">Category *</Label>
						<select
							bind:value={formData.category}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							required
						>
							<option value="">Select a category</option>
							{#each categories as category}
								<option value={category.value}>
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

	{#if data.error}
		<Alert variant="destructive">
			<AlertCircle class="size-5" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{data.error}</AlertDescription>
		</Alert>
	{:else if isError}
		<Alert variant="destructive">
			<AlertCircle class="size-5" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{errorMessage}</AlertDescription>
		</Alert>
	{:else if isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="flex flex-col items-center gap-4">
				<Loader2 class="size-8 animate-spin text-primary" />
				<p class="text-sm text-muted-foreground">Loading recurrent payments...</p>
			</div>
		</div>
	{:else}
		<Tabs bind:value={activeTab} class="w-full">
			<TabsList class="grid grid-cols-2 mb-4 bg-sidebar">
				<TabsTrigger value="overview" class="hover:bg-background">Overview</TabsTrigger>
				<TabsTrigger value="payments" class="hover:bg-background">All Payments</TabsTrigger>
			</TabsList>

			<TabsContent value="overview" class="space-y-6">
				<!-- Upcoming Payments -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Clock class="size-5" />
							Next 7 Days
						</CardTitle>
						<CardDescription>Upcoming payments requiring your attention</CardDescription>
					</CardHeader>
					<CardContent>
						{#if recurrentPayments.length === 0}
							<div class="text-center py-8">
								<Calendar class="size-12 text-muted-foreground mx-auto mb-4" />
								<p class="text-muted-foreground">No upcoming payments</p>
							</div>
						{:else}
							{@const upcomingPayments = recurrentPayments
								.map((payment) => ({ ...payment, daysUntil: getDaysUntilNext(payment) }))
								.filter((payment) => payment.daysUntil <= 7)
								.sort((a, b) => a.daysUntil - b.daysUntil)}

							{#if upcomingPayments.length === 0}
								<div class="text-center py-8">
									<CheckCircle class="size-12 text-green-500 mx-auto mb-4" />
									<p class="text-muted-foreground">No payments due in the next 7 days</p>
								</div>
							{:else}
								<div class="space-y-3">
									{#each upcomingPayments as payment}
										{@const CategoryIcon = getCategoryIcon(payment.category)}
										<div class="flex items-center gap-4 p-3 border rounded-lg">
											<div class="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
												<CategoryIcon class="size-5" />
											</div>
											<div class="flex-1">
												<p class="font-medium">{payment.name}</p>
												<p class="text-sm text-muted-foreground capitalize">{payment.category}</p>
											</div>
											<div class="text-right">
												<p class="font-bold">{formatCurrency(payment.amount)}</p>
												<p class="text-sm text-muted-foreground">
													{payment.daysUntil === 0
														? 'Today'
														: payment.daysUntil === 1
															? 'Tomorrow'
															: `${payment.daysUntil} days`}
												</p>
											</div>
											{#if payment.autoPay}
												<Badge variant="secondary" class="gap-1">
													<Zap class="size-3" />
													Auto
												</Badge>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						{/if}
					</CardContent>
				</Card>

				<!-- Category Breakdown -->
				<Card>
					<CardHeader>
						<CardTitle>Monthly Spending by Category</CardTitle>
						<CardDescription>Breakdown of your recurring payment categories</CardDescription>
					</CardHeader>
					<CardContent>
						{#if recurrentPayments.length === 0}
							<div class="text-center py-8">
								<div class="text-6xl mb-4">📊</div>
								<p class="text-muted-foreground">No data available yet</p>
							</div>
						{:else}
							{@const categoryTotals: Record<string, number> = recurrentPayments.reduce((acc, payment) => {
								const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency);
								acc[payment.category] = (acc[payment.category] || 0) + monthlyAmount;
								return acc;
								}, {} as Record<string, number>)}

							<div class="space-y-4">
								{#each Object.entries(categoryTotals).sort(([, a], [, b]) => (b as number) - (a as number)) as [category, amount], index}
									{@const CategoryIcon = getCategoryIcon(category)}
									{@const percentage =
										totalMonthlyAmount > 0 ? ((amount as number) / totalMonthlyAmount) * 100 : 0}

									<div class="space-y-2">
										<div class="flex justify-between items-center">
											<div class="flex items-center gap-2">
												<CategoryIcon class="size-5" />
												<span class="text-sm font-medium capitalize">{category}</span>
											</div>
											<div class="text-right">
												<div class="text-sm font-bold">{formatCurrency(amount as number)}</div>
												<div class="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
											</div>
										</div>
										<Progress value={percentage} class="h-2" />
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>

				<!-- Statistics Overview -->
				<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent class="p-3 py-1">
							<div class="flex items-center gap-2">
								<CreditCard class="size-5 text-blue-500" />
								<div>
									<p class="text-sm text-muted-foreground">Active Payments</p>
									<p class="text-xl font-bold">{activePayments}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent class="p-3 py-1">
							<div class="flex items-center gap-2">
								<TrendingDown class="size-5 text-red-500" />
								<div>
									<p class="text-sm text-muted-foreground">Monthly Total</p>
									<p class="text-xl font-bold">{formatCurrency(totalMonthlyAmount)}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent class="p-3 py-1">
							<div class="flex items-center gap-2">
								<Zap class="size-5 text-green-500" />
								<div>
									<p class="text-sm text-muted-foreground">Auto Pay</p>
									<p class="text-xl font-bold">{autoPayments}</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent class="p-3 py-1">
							<div>
								<p class="text-sm text-muted-foreground">Yearly Total</p>
								<p class="text-xl font-bold">{formatCurrency(totalMonthlyAmount * 12)}</p>
								<p class="text-xs text-muted-foreground">Estimated annual cost</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="payments" class="space-y-6">
				<!-- All Payments Grid -->
				<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each recurrentPayments as payment (payment.id)}
						{@const CategoryIcon = getCategoryIcon(payment.category)}
						{@const monthlyAmount = calculateMonthlyAmount(payment.amount, payment.frequency)}
						{@const nextDate = getNextPaymentDate(payment)}
						{@const isExpired = payment.endDate && new Date(payment.endDate) < new Date()}

						<Card class="transition-all hover:shadow-lg {isExpired ? 'opacity-60' : ''}">
							<CardHeader>
								<div class="flex items-start justify-between">
									<div class="flex items-center gap-3">
										<div class="flex items-center justify-center w-10 h-10 bg-muted rounded-lg">
											<CategoryIcon class="size-5" />
										</div>
										<div>
											<CardTitle class="text-lg text-nowrap truncate pr-2">{payment.name}</CardTitle
											>
											<CardDescription class="capitalize">{payment.category}</CardDescription>
										</div>
									</div>
									<div class="flex items-center gap-1">
										<Button
											size="sm"
											variant="ghost"
											onclick={() => openEditSheet(payment)}
											class="size-8 p-0"
											disabled={$deletePaymentMutation.isPending}
										>
											<Edit class="size-5" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => handleDelete(payment.id, payment.name)}
											class="size-8 p-0 text-red-500 hover:text-red-600"
											disabled={$deletePaymentMutation.isPending}
										>
											{#if $deletePaymentMutation.isPending && $deletePaymentMutation.variables === payment.id}
												<Loader2 class="size-5 animate-spin" />
											{:else}
												<Trash2 class="size-5" />
											{/if}
										</Button>
									</div>
								</div>
							</CardHeader>

							<CardContent class="space-y-4">
								<!-- Amount and Frequency -->
								<div class="space-y-3">
									<!-- Main Amount Display -->
									<div class="flex items-center justify-between">
										<div class="flex items-baseline gap-2">
											<span class="text-3xl font-bold text-foreground">
												{formatCurrency(payment.amount)}
											</span>
											<span class="text-sm text-muted-foreground font-medium">
												/{payment.frequency}
											</span>
										</div>
										<Badge class={`${getFrequencyColor(payment.frequency)} px-3 py-1 font-medium`}>
											{payment.frequency.charAt(0).toUpperCase() + payment.frequency.slice(1)}
										</Badge>
									</div>

									<!-- Conversion Info with Visual Enhancement -->
									<div
										class="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border-l-4 border-l-primary/20"
									>
										<div
											class="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full"
										>
											<svg
												class="w-4 h-4 text-primary"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
												/>
											</svg>
										</div>
										<div class="flex-1">
											{#if payment.frequency === 'monthly'}
												<div class="flex items-center justify-between">
													<span class="text-sm text-muted-foreground">Annual projection</span>
													<span class="text-lg font-bold text-primary">
														{formatCurrency(payment.amount * 12)}
													</span>
												</div>
											{:else}
												<div class="flex items-center justify-between">
													<span class="text-sm text-muted-foreground">Monthly equivalent</span>
													<span class="text-lg font-bold text-primary">
														{formatCurrency(monthlyAmount)}
													</span>
												</div>
											{/if}
										</div>
									</div>
								</div>

								<Separator />

								<div class="grid grid-cols-3 gap-4">
									<!-- Next Payment / Status -->
									<div class="space-y-1">
										<p class="text-sm text-muted-foreground">
											{isExpired ? 'Status' : 'Next Payment'}
										</p>
										{#if isExpired}
											<p class="font-medium text-red-600">Expired</p>
										{:else}
											<p class="font-medium">{formatDate(nextDate)}</p>
										{/if}
									</div>

									<div></div>

									<!-- Auto Pay Status -->
									<div class="space-y-1">
										<p class="text-sm text-muted-foreground">Auto Pay</p>
										<div class="flex items-center gap-2">
											{#if payment.autoPay}
												<CheckCircle class="size-5 text-green-500" />
												<span class="text-sm text-green-600">Enabled</span>
											{:else}
												<AlertCircle class="size-5 text-yellow-500" />
												<span class="text-sm text-yellow-600">Manual</span>
											{/if}
										</div>
									</div>
								</div>
								<!-- End Date Status -->
								{#if isExpired && payment.endDate}
									<Badge variant="secondary" class="w-full justify-center">
										Expired on {formatDate(payment.endDate)}
									</Badge>
								{:else if payment.endDate}
									<p class="text-xs text-muted-foreground">
										Ends on {formatDate(payment.endDate)}
									</p>
								{/if}
							</CardContent>
						</Card>
					{/each}

					{#if recurrentPayments.length === 0}
						<div class="col-span-full">
							<Card>
								<CardContent class="flex flex-col items-center justify-center py-12">
									<div class="text-6xl mb-4">💳</div>
									<h3 class="text-xl font-medium mb-2">No Recurrent Payments Yet</h3>
									<p class="text-muted-foreground text-center max-w-md mb-4">
										Start automating your finances by setting up recurring payments for
										subscriptions, bills, and regular expenses.
									</p>
									<Button onclick={openCreateSheet} class="gap-2">
										<Plus class="size-5" />
										Create Your First Payment
									</Button>
								</CardContent>
							</Card>
						</div>
					{/if}
				</div>
			</TabsContent>
		</Tabs>
	{/if}
</div>
