<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/stores';
	import { MessageSquare, Sparkles, Home, HomeIcon } from 'lucide-svelte';
	import type { ComponentProps } from 'svelte';

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const navigationItems = [
		{
			title: 'Home',
			url: '/',
			icon: MessageSquare,
			description: 'AI Assistant Chat'
		},
		{
			title: 'Animations',
			url: '/animation',
			icon: Sparkles,
			description: 'Animotion Playground'
		},
		{
			title: 'Accounts',
			url: '/accounts',
			icon: HomeIcon,
			description: 'Account Overview'
		}
	];
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					<a href="/" class="flex items-center gap-2">
						<div
							class="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-md flex items-center justify-center"
						>
							<span class="text-xs font-bold text-white">A</span>
						</div>
						<span class="text-base font-semibold">Acme Inc.</span>
					</a>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navigationItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={$page.url.pathname === item.url}>
								<a href={item.url} class="flex items-center gap-2">
									<svelte:component this={item.icon} class="w-4 h-4" />
									<span>{item.title}</span>
								</a>
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<Sidebar.Group>
			<Sidebar.GroupLabel>Features</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<div class="p-2 text-sm text-muted-foreground">
					<p class="mb-2">🎨 Beautiful animations</p>
					<p class="mb-2">💬 AI-powered chat</p>
					<p class="mb-2">🎯 Modern UI components</p>
				</div>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<div class="p-2 text-xs text-muted-foreground">
			<p>Built with SvelteKit & Animotion</p>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
