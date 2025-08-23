<script lang="ts">
	import AccountsOverview from '$lib/blocks/AccountsOverview.svelte';
	import SavingsProfiles from '$lib/blocks/SavingsProfiles.svelte';
	import { getBankAccounts } from '$lib/api.js';
	import { onMount } from 'svelte';

	let {
		componentName,
		class: className,
		...restProps
	}: {
		componentName: string;
		class?: string;
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
				case 'savings-profiles':
				case 'savings-analysis':
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
	{:else if componentName === 'savings-profiles' || componentName === 'savings-analysis'}
		<SavingsProfiles />
	{:else if componentName === 'transaction-overview'}
		<div class="text-center py-8 text-muted-foreground">
			<p>Transaction overview component coming soon</p>
		</div>
	{:else if componentName === 'transaction-stats'}
		<div class="text-center py-8 text-muted-foreground">
			<p>Transaction statistics component coming soon</p>
		</div>
	{:else if componentName === 'transaction-charts'}
		<div class="text-center py-8 text-muted-foreground">
			<p>Transaction charts component coming soon</p>
		</div>
	{:else if componentName === 'recurrent-payment-stats'}
		<div class="text-center py-8 text-muted-foreground">
			<p>Recurrent payment stats component coming soon</p>
		</div>
	{:else}
		<div class="text-center py-8 text-muted-foreground">
			<p>Component "{componentName}" is not yet implemented</p>
		</div>
	{/if}
</div>
