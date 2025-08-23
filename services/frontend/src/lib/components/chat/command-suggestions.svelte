<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	interface Command {
		name: string;
		description: string;
		icon?: string;
	}

	let {
		commands = [],
		visible = false,
		selectedIndex = 0,
		onSelect,
		class: className,
		...restProps
	}: {
		commands: Command[];
		visible: boolean;
		selectedIndex: number;
		onSelect: (command: Command) => void;
		class?: string;
	} = $props();
</script>

{#if visible && commands.length > 0}
	<div
		class={cn(
			'bg-popover text-popover-foreground absolute bottom-full left-0 right-0 mb-2 max-h-64 overflow-y-auto rounded-lg border shadow-lg',
			className
		)}
		{...restProps}
	>
		<div class="p-2">
			<div class="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
				Commands
			</div>
			{#each commands as command, index}
				<button
					class={cn(
						'flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors',
						index === selectedIndex
							? 'bg-primary text-primary-foreground'
							: 'hover:bg-accent hover:text-accent-foreground'
					)}
					onclick={() => onSelect(command)}
				>
					{#if command.icon}
						<span class="text-muted text-lg">{command.icon}</span>
					{/if}
					<div class="flex-1">
						<div class="font-medium">/{command.name}</div>
						<div class="text-white/75 text-xs">{command.description}</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}
