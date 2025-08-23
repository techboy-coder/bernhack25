<script lang="ts">
	import AccountsOverview from '$lib/blocks/AccountsOverview.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<AccountsOverview {data} />
