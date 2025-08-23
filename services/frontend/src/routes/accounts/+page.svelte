<script lang="ts">
	import AccountsOverview from '$lib/blocks/AccountsOverview.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<div class="flex-1 space-y-6 p-6">
	<!-- Page Header -->
	<div class="space-y-2">
		<h1 class="text-3xl font-bold tracking-tight text-foreground">Bank Accounts</h1>
		<p class="text-muted-foreground">Manage and overview your financial accounts</p>
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
	{:else if !data.bankAccounts || data.bankAccounts.length === 0}
		<!-- Empty State -->
		<Card class="text-center py-12">
			<CardContent class="space-y-6">
				<div class="text-6xl">🏦</div>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">No Bank Accounts Found</h3>
					<p class="text-muted-foreground max-w-sm mx-auto">
						You don't have any bank accounts set up yet. Add your first account to get started.
					</p>
				</div>
				<Button>Add Bank Account</Button>
			</CardContent>
		</Card>
	{:else}
		<!-- Main Content -->
		<AccountsOverview {data} />
	{/if}
</div>
