<script lang="ts">
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { cn } from '$lib/utils.js';
	import { Loader2 } from 'lucide-svelte';
	import type { AIDecision } from '$lib/api.js';
	import ComponentRegistry from '../ai/component-registry.svelte';

	// Import components dynamically
	import AccountsOverview from '$lib/blocks/AccountsOverview.svelte';
	import SavingsProfiles from '$lib/blocks/SavingsProfiles.svelte';

	interface Message {
		id: string;
		content: string;
		author: {
			name: string;
			avatar?: string;
		};
		timestamp: Date;
		isUser: boolean;
		aiDecision?: AIDecision;
	}

	let {
		messages = [],
		isLoading = false,
		class: className,
		...restProps
	}: {
		messages: Message[];
		isLoading?: boolean;
		class?: string;
	} = $props();

	function formatTime(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date);
	}

	function getMessageWidth(message: Message): string {
		// User messages: 30% width
		if (message.isUser) {
			return 'max-w-[30%]';
		}

		// AI component responses: 80% width
		if (message.aiDecision?.type === 'component') {
			return 'max-w-[80%]';
		}

		// Generic AI responses: 30% width
		return 'max-w-[50%]';
	}

	function shouldShowComponent(message: Message): boolean {
		return !message.isUser && message.aiDecision?.type === 'component';
	}

	function getComponents(message: Message): string[] {
		const content = message.aiDecision?.content;
		if (Array.isArray(content)) {
			return content;
		} else if (typeof content === 'string') {
			return [content];
		}
		return [];
	}

	function getAccountId(message: Message): string | undefined {
		return message.aiDecision?.accountId;
	}

	function getAccountType(message: Message): string | undefined {
		return message.aiDecision?.accountType;
	}
</script>

<div class={cn('flex flex-col gap-4 p-4', className)} {...restProps}>
	{#if messages.length === 0}
		<div class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
			<div class="mb-4 text-6xl">💬</div>
			<h3 class="mb-2 text-lg font-medium">Start a conversation with Ueli</h3>
			<p class="text-sm">Ask about your finances, transactions, or savings goals.</p>
		</div>
	{:else}
		{#each messages as message (message.id)}
			<div class={cn('flex gap-3 group', message.isUser && 'flex-row-reverse')}>
				<Avatar class="size-8 shrink-0">
					<AvatarImage src={message.author.avatar} alt={message.author.name} />
					<AvatarFallback class="bg-primary text-primary-foreground text-xs">
						{message.author.name === 'Ueli' ? '🤖' : message.author.name.slice(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>

				<div class={cn('flex-1 space-y-1', message.isUser && 'text-right')}>
					<div class={cn('flex items-center gap-2', message.isUser && 'justify-end')}>
						<span class="text-foreground text-sm font-medium pr-1">
							{message.author.name}
						</span>
					</div>

					<!-- Regular message content -->
					{#if !shouldShowComponent(message)}
						<div
							class={cn(
								'rounded-lg border border-input/75 p-3 text-sm shadow-sm',
								getMessageWidth(message),
								message.isUser ? 'bg-background/30 text-foreground ml-auto' : 'bg-background/20'
							)}
						>
							{message.content}
						</div>
					{:else}
						<!-- Component rendering -->
						<div class={cn('rounded-lg shadow-sm space-y-3', getMessageWidth(message))}>
							<!-- Show message content if present -->
							{#if message.content.trim()}
								<div class="bg-background/20 p-3 border border-input/50 rounded-lg">
									<p class="text-sm text-foreground">{message.content}</p>
								</div>
							{/if}

							<!-- Render each component -->
							{#each getComponents(message) as componentName}
								<div class="bg-background/5 border border-input/50 rounded-lg overflow-hidden">
									<ComponentRegistry
										{componentName}
										accountId={getAccountId(message)}
										accountType={getAccountType(message)}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{/if}

	<!-- Loading indicator -->
	{#if isLoading}
		<div class="flex gap-3">
			<Avatar class="size-8 shrink-0">
				<AvatarFallback class="bg-primary text-primary-foreground text-xs">🤖</AvatarFallback>
			</Avatar>
			<div class="flex-1 space-y-1">
				<div class="flex items-center gap-2">
					<span class="text-foreground text-sm font-medium pr-1">Ueli</span>
				</div>
				<div
					class="max-w-[30%] rounded-lg border border-input/75 p-3 text-sm shadow-sm bg-background/20"
				>
					<div class="flex items-center gap-2">
						<Loader2 class="size-4 animate-spin" />
						<span>Thinking...</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
