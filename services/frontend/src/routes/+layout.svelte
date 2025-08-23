<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

	let { children } = $props();

	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from './app-sidebar.svelte';

	// Create a client
	const queryClient = new QueryClient();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="">
		<ModeWatcher defaultMode="dark" />
		<Sidebar.Provider
			class="!bg-background"
			style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
		>
			<AppSidebar variant="sidebar" />
			<Sidebar.Inset>
				{@render children?.()}
			</Sidebar.Inset>
		</Sidebar.Provider>
	</div>
</QueryClientProvider>
