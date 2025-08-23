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
	import {
		CalendarIcon,
		Plus,
		Target,
		TrendingUp,
		Clock,
		Edit,
		Trash2,
		Loader2
	} from 'lucide-svelte';

	// Import TanStack Query hooks and API functions
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import {
		getSavingsGoals,
		createSavingsGoal,
		updateSavingsGoal,
		deleteSavingsGoal
	} from '$lib/api';

	// Types - define locally to avoid import issues
	interface SavingsGoal {
		id: string;
		name: string;
		currentAmount: number;
		targetAmount: number;
		startDate: string;
		targetDate?: string;
		category: string;
	}

	// Form state
	let isSheetOpen = $state(false);
	let isEditing = $state(false);
	let editingGoal: SavingsGoal | null = $state(null);
	let formData = $state({
		name: '',
		targetAmount: 0,
		currentAmount: 0,
		targetDate: '',
		category: ''
	});
	let error = $state('');

	// TanStack Query setup
	const queryClient = useQueryClient();

	// Query for fetching all savings goals
	const goalsQuery = createQuery({
		queryKey: ['savingsGoals'],
		queryFn: () => getSavingsGoals(),
		staleTime: 1000 * 60 // 1 minute
	});

	// Mutation for creating a new savings goal - fix mutate usage
	const createGoalMutation = createMutation({
		mutationFn: (goalData: Parameters<typeof createSavingsGoal>[0]) => createSavingsGoal(goalData),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
			resetForm();
			isSheetOpen = false;
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to create savings goal';
		}
	});

	// Mutation for updating an existing savings goal - fix mutate usage
	const updateGoalMutation = createMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Omit<SavingsGoal, 'id'>> }) =>
			updateSavingsGoal(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
			resetForm();
			isSheetOpen = false;
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to update savings goal';
		}
	});

	// Mutation for deleting a savings goal - fix mutate usage
	const deleteGoalMutation = createMutation({
		mutationFn: (id: string) => deleteSavingsGoal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
		},
		onError: (err: Error) => {
			error = err.message || 'Failed to delete savings goal';
		}
	});

	// Categories for savings goals
	const categories = [
		{ value: 'Emergency', icon: '🚨', description: 'Emergency fund & unexpected expenses' },
		{ value: 'Travel', icon: '✈️', description: 'Vacation and travel expenses' },
		{ value: 'Technology', icon: '💻', description: 'Gadgets, electronics, software' },
		{ value: 'Home', icon: '🏠', description: 'Home improvement & furnishing' },
		{ value: 'Education', icon: '📚', description: 'Courses, books, certifications' },
		{ value: 'Health', icon: '🏥', description: 'Health & wellness expenses' },
		{ value: 'Investment', icon: '📈', description: 'Investment goals & financial growth' },
		{ value: 'Car', icon: '🚗', description: 'Vehicle purchase or maintenance' },
		{ value: 'Wedding', icon: '💍', description: 'Wedding and celebration expenses' },
		{ value: 'Gift', icon: '🎁', description: 'Gifts for family and friends' },
		{ value: 'Other', icon: '💰', description: 'Other financial goals' }
	];

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

	function calculateProgress(current: number, target: number): number {
		return Math.min((current / target) * 100, 100);
	}

	function calculateTimeRemaining(targetDate?: string): string {
		if (!targetDate) return 'No deadline set';

		const now = new Date();
		const target = new Date(targetDate);
		const diffTime = target.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) return 'Overdue';
		if (diffDays === 0) return 'Due today';
		if (diffDays === 1) return '1 day left';
		if (diffDays < 30) return `${diffDays} days left`;
		if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`;
		return `${Math.ceil(diffDays / 365)} years left`;
	}

	function getProgressColor(progress: number): string {
		if (progress >= 100) return 'hsl(var(--success))';
		if (progress >= 75) return 'hsl(var(--primary))';
		if (progress >= 50) return 'hsl(var(--warning))';
		if (progress >= 25) return 'hsl(var(--orange))';
		return 'hsl(var(--destructive))';
	}

	function getCategoryIcon(category: string): string {
		const cat = categories.find((c) => c.value === category);
		return cat?.icon || '💰';
	}

	function resetForm() {
		formData = {
			name: '',
			targetAmount: 0,
			currentAmount: 0,
			targetDate: '',
			category: ''
		};
		isEditing = false;
		editingGoal = null;
		error = '';
	}

	function openCreateSheet() {
		resetForm();
		isSheetOpen = true;
	}

	function openEditSheet(goal: SavingsGoal) {
		formData = {
			name: goal.name,
			targetAmount: goal.targetAmount,
			currentAmount: goal.currentAmount,
			targetDate: goal.targetDate || '',
			category: goal.category
		};
		isEditing = true;
		editingGoal = goal;
		isSheetOpen = true;
	}

	function handleSubmit() {
		if (!formData.name.trim() || formData.targetAmount <= 0) {
			error = 'Please fill in all required fields';
			return;
		}

		const goalData = {
			name: formData.name.trim(),
			targetAmount: formData.targetAmount,
			currentAmount: formData.currentAmount,
			category: formData.category || 'Other',
			targetDate: formData.targetDate || undefined,
			startDate: isEditing && editingGoal ? editingGoal.startDate : new Date().toISOString()
		};

		if (isEditing && editingGoal) {
			$updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
		} else {
			$createGoalMutation.mutate(goalData);
		}
	}

	function handleDelete(goalId: string) {
		if (confirm('Are you sure you want to delete this savings goal?')) {
			$deleteGoalMutation.mutate(goalId);
		}
	}

	// Fix $derived syntax - use proper reactive declarations
	let savingsGoals: SavingsGoal[] = $derived($goalsQuery.data || []);
	let totalTarget: number = $derived(
		savingsGoals.reduce((sum: number, p: SavingsGoal) => sum + p.targetAmount, 0)
	);
	let totalCurrent: number = $derived(
		savingsGoals.reduce((sum: number, p: SavingsGoal) => sum + p.currentAmount, 0)
	);
	let completedGoals: number = $derived(
		savingsGoals.filter((p: SavingsGoal) => p.currentAmount >= p.targetAmount).length
	);
	let activeGoals: number = $derived(savingsGoals.length - completedGoals);
	let overallProgress: number = $derived(totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0);

	// Handle loading and error states
	let isLoading: boolean = $derived($goalsQuery.isLoading);
	let isError: boolean = $derived($goalsQuery.isError);
	let errorMessage: string = $derived($goalsQuery.error?.message || 'Failed to load savings goals');
</script>

<div class="space-y-6">
	<!-- Header with Action Button -->
	<div class="flex items-center justify-between">
		<div class="space-y-2">
			<h2 class="text-2xl font-bold tracking-tight">🎯 Savings Goals</h2>
			<p class="text-muted-foreground">
				Track your progress towards financial goals with smart insights
			</p>
		</div>
		<Sheet bind:open={isSheetOpen}>
			<SheetTrigger>
				<Button onclick={openCreateSheet} class="gap-2">
					<Plus class="size-4" />
					New Goal
				</Button>
			</SheetTrigger>
			<SheetContent class="w-full sm:max-w-md p-6">
				<SheetHeader class="p-0">
					<SheetTitle>
						{isEditing ? 'Edit Savings Goal' : 'Create New Savings Goal'}
					</SheetTitle>
					<SheetDescription>
						{isEditing
							? 'Update your savings goal details and track your progress.'
							: 'Set up a new savings goal to track your financial progress.'}
					</SheetDescription>
				</SheetHeader>

				<div class="grid gap-6 py-6">
					<!-- Goal Name -->
					<div class="space-y-2">
						<Label for="name">Goal Name *</Label>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder="e.g., Emergency Fund, Vacation to Japan"
							required
						/>
					</div>

					<!-- Target Amount -->
					<div class="space-y-2">
						<Label for="target">Target Amount (CHF) *</Label>
						<Input
							id="target"
							type="number"
							bind:value={formData.targetAmount}
							min="1"
							step="50"
							placeholder="5000"
							required
						/>
					</div>

					<!-- Current Amount -->
					<div class="space-y-2">
						<Label for="current">Current Amount (CHF)</Label>
						<Input
							id="current"
							type="number"
							bind:value={formData.currentAmount}
							min="0"
							step="50"
							placeholder="0"
						/>
					</div>

					<!-- Category -->
					<div class="space-y-2">
						<Label for="category">Category</Label>
						<select
							bind:value={formData.category}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							<option value="">Select a category</option>
							{#each categories as category}
								<option value={category.value}>
									{category.icon}
									{category.value} - {category.description}
								</option>
							{/each}
						</select>
					</div>

					<!-- Target Date -->
					<div class="space-y-2">
						<Label for="target-date">Target Date (Optional)</Label>
						<Input
							id="target-date"
							type="date"
							bind:value={formData.targetDate}
							min={new Date().toISOString().split('T')[0]}
						/>
					</div>

					{#if error}
						<div class="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
							{error}
						</div>
					{/if}

					<div class="flex gap-3 pt-4">
						<Button
							onclick={handleSubmit}
							disabled={$createGoalMutation.isPending || $updateGoalMutation.isPending}
							class="flex-1 gap-2"
						>
							{#if $createGoalMutation.isPending || $updateGoalMutation.isPending}
								<Loader2 class="size-4 animate-spin" />
								{isEditing ? 'Updating...' : 'Creating...'}
							{:else}
								{isEditing ? 'Update Goal' : 'Create Goal'}
							{/if}
						</Button>
						<Button variant="outline" onclick={() => (isSheetOpen = false)}>Cancel</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	</div>

	{#if isError}
		<Alert variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{errorMessage}</AlertDescription>
		</Alert>
	{:else if isLoading}
		<div class="flex justify-center items-center py-12">
			<div class="flex flex-col items-center gap-4">
				<Loader2 class="size-8 animate-spin text-primary" />
				<p class="text-sm text-muted-foreground">Loading savings goals...</p>
			</div>
		</div>
	{:else}
		<!-- Statistics Overview -->
		<div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<Target class="size-5 text-blue-500" />
						<div>
							<p class="text-sm text-muted-foreground">Active Goals</p>
							<p class="text-2xl font-bold">{activeGoals}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-4">
					<div class="flex items-center gap-2">
						<TrendingUp class="size-5 text-green-500" />
						<div>
							<p class="text-sm text-muted-foreground">Completed</p>
							<p class="text-2xl font-bold">{completedGoals}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-4">
					<div>
						<p class="text-sm text-muted-foreground">Total Progress</p>
						<p class="text-2xl font-bold">{formatCurrency(totalCurrent)}</p>
						<p class="text-xs text-muted-foreground">of {formatCurrency(totalTarget)}</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="p-4">
					<div>
						<p class="text-sm text-muted-foreground">Overall Progress</p>
						<p class="text-2xl font-bold">{Math.round(overallProgress)}%</p>
						<Progress value={overallProgress} class="mt-2 h-2" />
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Savings Goals Grid -->
		<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
			{#each savingsGoals as goal (goal.id)}
				{@const progress = calculateProgress(goal.currentAmount, goal.targetAmount)}
				{@const timeRemaining = calculateTimeRemaining(goal.targetDate)}
				{@const isCompleted = progress >= 100}

				<Card
					class="transition-all hover:shadow-lg {isCompleted
						? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50'
						: ''}"
				>
					<CardHeader class="pb-4">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-2">
								<span class="text-2xl">{getCategoryIcon(goal.category)}</span>
								<div>
									<CardTitle class="text-lg">{goal.name}</CardTitle>
									<CardDescription>{goal.category}</CardDescription>
								</div>
							</div>
							<div class="flex items-center gap-1">
								<Button
									size="sm"
									variant="ghost"
									onclick={() => openEditSheet(goal)}
									class="size-8 p-0"
									disabled={$deleteGoalMutation.isPending}
								>
									<Edit class="size-4" />
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onclick={() => handleDelete(goal.id)}
									class="size-8 p-0 text-red-500 hover:text-red-600"
									disabled={$deleteGoalMutation.isPending}
								>
									{#if $deleteGoalMutation.isPending && $deleteGoalMutation.variables === goal.id}
										<Loader2 class="size-4 animate-spin" />
									{:else}
										<Trash2 class="size-4" />
									{/if}
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent class="space-y-4">
						<!-- Progress -->
						<div class="space-y-2">
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">Progress</span>
								<span class="font-medium {isCompleted ? 'text-green-600' : ''}"
									>{Math.round(progress)}%</span
								>
							</div>
							<Progress value={progress} class="h-3" />
							<div class="flex justify-between text-sm">
								<span class="font-medium">{formatCurrency(goal.currentAmount)}</span>
								<span class="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
							</div>
						</div>

						{#if isCompleted}
							<div
								class="p-3 bg-green-100 dark:bg-green-900 rounded-md border border-green-200 dark:border-green-800"
							>
								<div class="flex items-center gap-2 text-green-700 dark:text-green-300">
									<Target class="size-4" />
									<span class="text-sm font-medium">Goal Completed! 🎉</span>
								</div>
							</div>
						{:else}
							<!-- Remaining Amount -->
							<div class="p-3 bg-muted/50 rounded-md">
								<div class="flex justify-between items-center">
									<span class="text-sm text-muted-foreground">Remaining</span>
									<span class="font-medium"
										>{formatCurrency(goal.targetAmount - goal.currentAmount)}</span
									>
								</div>
							</div>
						{/if}

						<!-- Timeline Info -->
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock class="size-4" />
							<span>{timeRemaining}</span>
						</div>

						<!-- Started Date -->
						<div class="pt-2 border-t text-xs text-muted-foreground">
							Started {formatDate(goal.startDate)}
						</div>
					</CardContent>
				</Card>
			{/each}

			{#if savingsGoals.length === 0}
				<div class="col-span-full">
					<Card>
						<CardContent class="flex flex-col items-center justify-center py-12">
							<div class="text-6xl mb-4">🎯</div>
							<h3 class="text-xl font-medium mb-2">No Savings Goals Yet</h3>
							<p class="text-muted-foreground text-center max-w-md mb-4">
								Start your financial journey by creating your first savings goal. Set targets, track
								progress, and achieve your dreams!
							</p>
							<Button onclick={openCreateSheet} class="gap-2">
								<Plus class="size-4" />
								Create Your First Goal
							</Button>
						</CardContent>
					</Card>
				</div>
			{/if}
		</div>
	{/if}
</div>
