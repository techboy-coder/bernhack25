<script lang="ts">
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { cn } from '$lib/utils.js';

	interface Message {
		id: string;
		content: string;
		author: {
			name: string;
			avatar?: string;
		};
		timestamp: Date;
		isUser: boolean;
	}

	let {
		messages = [],
		class: className,
		...restProps
	}: {
		messages: Message[];
		class?: string;
	} = $props();

	function formatTime(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date);
	}
</script>

<div class={cn('flex flex-col gap-4 p-4', className)} {...restProps}>
	{#if messages.length === 0}
		<div class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
			<div class="mb-4 text-6xl">💬</div>
			<h3 class="mb-2 text-lg font-medium">Start a conversation</h3>
			<p class="text-sm">Type a message below to get started. Use / for commands.</p>
		</div>
	{:else}
		{#each messages as message (message.id)}
			<div class={cn('flex gap-3 group', message.isUser && 'flex-row-reverse')}>
				<Avatar class="size-8 shrink-0">
					<AvatarImage src={message.author.avatar} alt={message.author.name} />
					<AvatarFallback class="bg-primary text-primary-foreground text-xs">
						{message.author.name.slice(0, 2).toUpperCase()}
					</AvatarFallback>
				</Avatar>

				<div class={cn('flex-1 space-y-1', message.isUser && 'text-right')}>
					<div class={cn('flex items-center gap-2', message.isUser && 'justify-end')}>
						<span class="text-foreground text-sm font-medium pr-1">
							{message.author.name}
						</span>
					</div>

					<div
						class={cn(
							'max-w-[80%] rounded-lg border border-input/75 p-3 text-sm shadow-sm',
							message.isUser ? 'bg-background/30 text-foreground ml-auto' : 'bg-background/20'
						)}
					>
						{message.content}
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
