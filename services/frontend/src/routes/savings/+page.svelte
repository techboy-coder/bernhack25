<script lang="ts">
	import SavingsProfiles from '$lib/blocks/SavingsProfiles.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';

	interface Transaction {
		id: string;
		amount: number;
		date: string;
		category: string;
		balance: number;
	}

	interface PageData {
		transactions: Transaction[];
		error?: string;
	}

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Savings Goals</title>
</svelte:head>

<div class="flex-1 space-y-6 p-6">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight text-foreground">💰 Savings Goals</h1>
		<p class="text-muted-foreground">Set and track your financial goals to achieve your dreams</p>
	</div>

	{#if data.error}
		<!-- Error State -->
		<Card class="border-destructive bg-destructive/5">
			<CardContent class="pt-6">
				<p class="text-destructive flex items-center gap-2">
					⚠️ {data.error}
				</p>
			</CardContent>
		</Card>
	{:else}
		<!-- Main Content - Only Savings Goals -->
		<SavingsProfiles />
	{/if}
</div>
