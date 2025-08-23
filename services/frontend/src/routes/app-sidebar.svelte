<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { page } from '$app/stores';
	import {
		MessageSquare,
		Sparkles,
		Home,
		HomeIcon,
		PiggyBank,
		CreditCard,
		Zap,
		TrendingUp,
		Shield
	} from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import type { ComponentProps } from 'svelte';
	import Logo from './logo.svelte';

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const navigationItems = [
		{
			title: 'Home',
			url: '/',
			icon: MessageSquare,
			description: 'Talk with Ueli',
			badge: null
		},
		{
			title: 'Accounts',
			url: '/accounts',
			icon: HomeIcon,
			description: 'Accounts in one place',
			badge: null
		},
		{
			title: 'Recurrent Payments',
			url: '/recurrent-payments',
			icon: CreditCard,
			description: 'Manage recurring payments',
			badge: null
		},
		{
			title: 'Saving Goals',
			url: '/savings',
			icon: PiggyBank,
			description: 'Track your saving goals',
			badge: null
		},
		{
			title: 'Summary',
			url: '/animation',
			icon: Sparkles,
			description: 'Animotion Playground',
			badge: null
		}
	];

	const features = [
		{ icon: Zap, text: 'AI-powered insights', color: 'text-yellow-400' },
		{ icon: TrendingUp, text: 'Smart analytics', color: 'text-green-400' },
		{ icon: Shield, text: 'Secure & private', color: 'text-blue-400' }
	];
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header
		class="border-b border-border/50 bg-gradient-to-r from-background to-background/80"
	>
		<div class="p-4">
			<a href="/" class="flex items-center gap-3 group">
				<div class="relative">
					<Logo></Logo>
				</div>
				<div class="flex-1">
					<div class="relative text-1xl">
						<span
							class="absolute top-0.5 left-0.5 font-black text-black/20 uppercase tracking-tight"
						>
							SPENDCAST
						</span>
						<span class="relative font-black text-primary uppercase tracking-tight">
							SPENDCAST
						</span>
					</div>
					<p class="text-xs text-muted-foreground mt-0.5">Financial Intelligence</p>
				</div>
			</a>
		</div>
	</Sidebar.Header>

	<Sidebar.Content class="bg-gradient-to-b from-background/50 to-background">
		<div class="py-3 px-2 flex flex-col justify-between h-full">
			<Sidebar.Group>
				<Sidebar.GroupLabel
					class="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider"
				>
					Navigation
				</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu class="space-y-1">
						{#each navigationItems as item}
							<Sidebar.MenuItem>
								<a href={item.url} class="block">
									<Sidebar.MenuButton
										isActive={$page.url.pathname === item.url}
										class="p-4 py-7 w-full rounded-lg transition-all duration-200 relative overflow-hidden {$page
											.url.pathname === item.url
											? 'bg-gradient-to-r from-primary/20 to-yellow-400/10 border border-primary/30'
											: ''}"
									>
										<div class="flex items-center gap-3 w-full">
											<div
												class="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 hover:bg-primary/20 transition-colors"
											>
												<item.icon
													class="w-4 h-4 {$page.url.pathname === item.url ? 'text-primary' : ''}"
												/>
											</div>
											<div class="flex-1 text-left">
												<div class="flex items-center justify-between">
													<span
														class="font-medium text-sm {$page.url.pathname === item.url
															? 'text-primary'
															: ''}"
													>
														{item.title}
													</span>
													{#if item.badge}
														<Badge
															variant="secondary"
															class="text-xs px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30"
														>
															{item.badge}
														</Badge>
													{/if}
												</div>
												<p
													class="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors"
												>
													{item.description}
												</p>
											</div>
										</div>
									</Sidebar.MenuButton>
								</a>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<div class="">
				<Separator class="my-3" />
				<Sidebar.Group>
					<Sidebar.GroupLabel
						class="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3"
					>
						Features
					</Sidebar.GroupLabel>
					<Sidebar.GroupContent>
						<div class="space-y-3">
							{#each features as feature}
								<div
									class="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/20 hover:border-border/40 transition-all duration-200"
								>
									<div class="flex items-center justify-center w-6 h-6 rounded-md bg-background/50">
										<feature.icon class="w-3.5 h-3.5 {feature.color}" />
									</div>
									<span class="text-sm text-muted-foreground">{feature.text}</span>
								</div>
							{/each}
						</div>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</div>
		</div>
	</Sidebar.Content>

	<Sidebar.Footer class="border-t border-border/30 bg-card/20">
		<div class="p-4">
			<div
				class="rounded-lg bg-gradient-to-r from-primary/10 to-yellow-400/10 border border-primary/20 p-3"
			>
				<div class="flex items-center gap-2 mb-2">
					<div class="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
						<Sparkles class="w-3 h-3 text-primary" />
					</div>
					<span class="text-sm font-medium text-foreground">PostFinance Spendcast</span>
				</div>
				<p class="text-xs text-muted-foreground leading-relaxed">Built with ❤️ by "Glassklar"</p>
			</div>
		</div>
	</Sidebar.Footer>
</Sidebar.Root>
