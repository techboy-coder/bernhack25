<script lang="ts">
	import AccountsOverview from '$lib/blocks/AccountsOverview.svelte';
	import AccountHeader from '$lib/blocks/AccountHeader.svelte';
	import SavingsProfiles from '$lib/blocks/SavingsProfiles.svelte';
	import SavingsAnalysis from '$lib/blocks/SavingsAnalysis.svelte';
	import TransactionStats from '$lib/blocks/TransactionStats.svelte';
	import TransactionCharts from '$lib/blocks/TransactionCharts.svelte';
	import TransactionOverview from '$lib/blocks/TransactionOverview.svelte';
	import TransactionTable from '$lib/blocks/TransactionTable.svelte';
	import RecurrentPaymentStats from '$lib/blocks/RecurrentPaymentStats.svelte';
	import RecurrentPaymentGrid from '$lib/blocks/RecurrentPaymentGrid.svelte';
	import RecurrentPaymentCategories from '$lib/blocks/RecurrentPaymentCategories.svelte';
	import UpcomingPayments from '$lib/blocks/UpcomingPayments.svelte';
	import { getBankAccounts } from '$lib/api.js';
	import { onMount } from 'svelte';

	let {
		componentName,
		class: className,
		accountType,
		accountId,
		...restProps
	}: {
		componentName: string;
		class?: string;
		accountType?: string;
		accountId?: string;
	} = $props();

	let data = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Load data based on component type
	onMount(async () => {
		try {
			switch (componentName) {
				case 'accounts-overview':
					const bankAccounts = await getBankAccounts();
					data = { bankAccounts };
					break;
				case 'account-header':
					const allAccounts = await getBankAccounts();

					// First priority: use specific accountId if provided
					if (accountId) {
						const specificAccount = allAccounts.find((acc: any) => acc.account.id === accountId);
						if (specificAccount) {
							data = { account: specificAccount };
						} else {
							throw new Error(`No account found with ID: ${accountId}`);
						}
					}
					// Second priority: use accountType if provided
					else if (accountType && accountType !== 'all') {
						const specificAccount = allAccounts.find(
							(acc: any) => acc.account.type === accountType
						);
						if (specificAccount) {
							data = { account: specificAccount };
						} else {
							throw new Error(`No ${accountType} account found`);
						}
					}
					// Fallback: use first account
					else {
						data = { account: allAccounts[0] };
					}
					break;
				case 'savings-profiles':
				case 'savings-analysis':
				case 'transaction-stats':
				case 'transaction-charts':
				case 'transaction-overview':
				case 'transaction-table':
				case 'recurrent-payment-stats':
				case 'recurrent-payment-grid':
				case 'recurrent-payment-categories':
				case 'upcoming-payments':
					// Data will be loaded by the component itself via TanStack Query
					data = {};
					break;
				default:
					data = {};
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	});
</script>

<div class={className} {...restProps}>
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-pulse text-muted-foreground">Loading component...</div>
		</div>
	{:else if error}
		<div class="text-center py-8 text-destructive">
			<p>Error loading component: {error}</p>
		</div>
	{:else if componentName === 'accounts-overview'}
		<AccountsOverview {data} />
	{:else if componentName === 'account-header'}
		<AccountHeader {data} />
	{:else if componentName === 'savings-profiles'}
		<SavingsProfiles />
	{:else if componentName === 'savings-analysis'}
		<SavingsAnalysis transactions={data.transactions || []} />
	{:else if componentName === 'transaction-overview'}
		<TransactionOverview />
	{:else if componentName === 'transaction-stats'}
		<TransactionStats transactions={data.transactions || []} accountCurrency="CHF" />
	{:else if componentName === 'transaction-charts'}
		<TransactionCharts transactions={data.transactions || []} />
	{:else if componentName === 'transaction-table'}
		<TransactionTable />
	{:else if componentName === 'recurrent-payment-stats'}
		<RecurrentPaymentStats />
	{:else if componentName === 'recurrent-payment-grid'}
		<RecurrentPaymentGrid />
	{:else if componentName === 'recurrent-payment-categories'}
		<RecurrentPaymentCategories />
	{:else if componentName === 'upcoming-payments'}
		<UpcomingPayments />
	{:else}
		<div class="text-center py-8 text-muted-foreground">
			<p>Component "{componentName}" is not yet implemented</p>
		</div>
	{/if}
</div>
