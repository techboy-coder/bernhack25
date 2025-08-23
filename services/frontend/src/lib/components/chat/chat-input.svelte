<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import CommandSuggestions from './command-suggestions.svelte';
	import UploadIcon from '@lucide/svelte/icons/paperclip';
	import MicrophoneIcon from '@lucide/svelte/icons/mic';
	import SendIcon from '@lucide/svelte/icons/send';

	interface Command {
		name: string;
		description: string;
		icon?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Type a message... Use / for commands',
		onSend,
		onFileUpload,
		onMicrophoneClick,
		class: className,
		disabled = false,
		...restProps
	}: {
		value: string;
		placeholder?: string;
		onSend?: (message: string) => void;
		onFileUpload?: () => void;
		onMicrophoneClick?: () => void;
		class?: string;
		disabled?: boolean;
	} = $props();

	const commands: Command[] = [
		{ name: 'help', description: 'Show available commands', icon: '❓' },
		{ name: 'clear', description: 'Clear the chat history', icon: '🗑️' },
		{ name: 'model', description: 'Switch AI model', icon: '🤖' },
		{ name: 'system', description: 'Set system prompt', icon: '⚙️' },
		{ name: 'export', description: 'Export conversation', icon: '💾' },
		{ name: 'image', description: 'Generate an image', icon: '🖼️' },
		{ name: 'code', description: 'Generate code snippet', icon: '💻' }
	];

	let showCommands = $state(false);
	let selectedCommandIndex = $state(0);
	let textareaRef: HTMLTextAreaElement | null = $state(null);
	let filteredCommandsList = $state<Command[]>([]);

	// Update filtered commands when value changes
	$effect(() => {
		if (!value.startsWith('/')) {
			filteredCommandsList = [];
		} else {
			const query = value.slice(1).toLowerCase();
			filteredCommandsList = commands.filter((cmd) => cmd.name.toLowerCase().includes(query));
		}
	});

	function handleInput() {
		showCommands = value.startsWith('/');
		selectedCommandIndex = 0;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (showCommands && filteredCommandsList.length > 0) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				selectedCommandIndex = Math.min(selectedCommandIndex + 1, filteredCommandsList.length - 1);
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				selectedCommandIndex = Math.max(selectedCommandIndex - 1, 0);
			} else if (event.key === 'Tab' || event.key === 'Enter') {
				if (event.key === 'Tab') event.preventDefault();
				selectCommand(filteredCommandsList[selectedCommandIndex]);
				return;
			} else if (event.key === 'Escape') {
				showCommands = false;
			}
		}

		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function selectCommand(command: Command) {
		value = `/${command.name} `;
		showCommands = false;
		textareaRef?.focus();
	}

	function handleSend() {
		if (value.trim() && !disabled) {
			onSend?.(value.trim());
			value = '';
		}
	}

	function autoResize() {
		if (textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = `${Math.min(textareaRef.scrollHeight, 200)}px`;
		}
	}

	$effect(() => {
		if (textareaRef) {
			autoResize();
		}
	});
</script>

<div class={cn('relative', className)} {...restProps}>
	<CommandSuggestions
		commands={filteredCommandsList}
		visible={showCommands}
		selectedIndex={selectedCommandIndex}
		onSelect={selectCommand}
	/>

	<div class="border-input relative flex items-end gap-2 rounded-lg border p-2">
		<!-- File Upload Button -->
		<Button
			variant="ghost"
			size="icon"
			class="text-muted-foreground hover:text-foreground shrink-0 self-end"
			onclick={onFileUpload}
			{disabled}
		>
			<UploadIcon class="size-4" />
			<span class="sr-only">Upload file</span>
		</Button>

		<!-- Chat Input -->
		<div class="flex-1 h-full">
			<Textarea
				bind:ref={textareaRef}
				bind:value
				{placeholder}
				class="resize-none border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
				style="min-height: 30px; max-height: 200px;"
				oninput={() => {
					handleInput();
					autoResize();
				}}
				onkeydown={handleKeyDown}
				{disabled}
				rows={1}
			/>
		</div>

		<!-- Action Buttons -->
		<div class="flex shrink-0 items-end gap-1">
			<!-- Microphone Button -->
			<Button
				variant="ghost"
				size="icon"
				class="text-muted-foreground hover:text-foreground"
				onclick={onMicrophoneClick}
				{disabled}
			>
				<MicrophoneIcon class="size-4" />
				<span class="sr-only">Voice input</span>
			</Button>

			<!-- Send Button -->
			<Button
				size="icon"
				class="bg-primary text-primary-foreground hover:bg-primary/90"
				onclick={handleSend}
				disabled={disabled || !value.trim()}
			>
				<SendIcon class="size-4" />
				<span class="sr-only">Send message</span>
			</Button>
		</div>
	</div>
</div>
