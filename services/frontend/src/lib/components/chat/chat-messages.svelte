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
		ttsEnabled = true,
		onTTSStateChange,
		class: className,
		...restProps
	}: {
		messages: Message[];
		isLoading?: boolean;
		ttsEnabled?: boolean;
		onTTSStateChange?: (speaking: boolean) => void;
		class?: string;
	} = $props();

	// TTS State
	let isTTSSupported = $state(false);
	let currentUtterance: SpeechSynthesisUtterance | null = $state(null);
	let spokenMessageIds = $state(new Set<string>());

	// Check TTS support on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			isTTSSupported = 'speechSynthesis' in window;
			console.log('🔊 TTS Support:', isTTSSupported);
		}
	});

	// Watch for new AI messages and speak them
	$effect(() => {
		console.log('🔊 TTS Effect triggered:', {
			isTTSSupported,
			ttsEnabled,
			messagesLength: messages.length,
			spokenMessageIdsSize: spokenMessageIds.size
		});

		if (!isTTSSupported || !ttsEnabled || !messages.length) return;

		// Find new AI messages that haven't been spoken yet
		const newAIMessages = messages.filter((msg) => !msg.isUser && !spokenMessageIds.has(msg.id));

		console.log('🔊 New AI messages to speak:', newAIMessages.length, newAIMessages);

		if (newAIMessages.length > 0) {
			const latestMessage = newAIMessages[newAIMessages.length - 1];
			console.log('🔊 About to speak message:', latestMessage);
			speakMessage(latestMessage);
			spokenMessageIds.add(latestMessage.id);
		}
	});

	function speakMessage(message: Message) {
		console.log('🔊 speakMessage called with:', {
			isTTSSupported,
			ttsEnabled,
			isUser: message.isUser,
			messageContent: message.content,
			aiDecision: message.aiDecision
		});

		if (!isTTSSupported || !ttsEnabled || message.isUser) {
			console.log('🔊 Early return from speakMessage');
			return;
		}

		// Cancel any current speech
		if (currentUtterance) {
			console.log('🔊 Canceling current utterance');
			window.speechSynthesis.cancel();
		}

		let textToSpeak = '';

		// Determine what to speak based on message type
		if (shouldShowComponent(message)) {
			// For component messages, speak the confirmation messages
			const components = getComponents(message);
			const confirmations = components.map((componentName) =>
				getConfirmationMessage(componentName, getAccountId(message), getAccountType(message))
			);
			textToSpeak = confirmations.join(' ');
			console.log('🔊 Component message - text to speak:', textToSpeak);
		} else {
			// For generic messages, speak the content
			textToSpeak = message.content;
			console.log('🔊 Generic message - text to speak:', textToSpeak);
		}

		if (!textToSpeak.trim()) {
			console.log('🔊 No text to speak, returning');
			return;
		}

		console.log('🔊 Creating utterance with text:', textToSpeak);
		console.log('🔊 speechSynthesis available:', !!window.speechSynthesis);
		console.log('🔊 speechSynthesis speaking:', window.speechSynthesis.speaking);
		console.log('🔊 speechSynthesis pending:', window.speechSynthesis.pending);
		console.log('🔊 speechSynthesis paused:', window.speechSynthesis.paused);

		const utterance = new SpeechSynthesisUtterance(textToSpeak);
		utterance.lang = 'en-US';
		utterance.rate = 1.1;
		utterance.pitch = 0.2;
		utterance.volume = 1;

		utterance.onstart = () => {
			console.log('🔊 TTS started successfully');
			currentUtterance = utterance;
			onTTSStateChange?.(true);
		};

		utterance.onend = () => {
			console.log('🔊 TTS finished successfully');
			currentUtterance = null;
			onTTSStateChange?.(false);
		};

		utterance.onerror = (event) => {
			console.error('🔊 TTS error occurred:', event);
			console.error('🔊 TTS error details:', {
				error: event.error,
				message: event
			});
			currentUtterance = null;
			onTTSStateChange?.(false);
		};

		// Try to speak immediately first
		console.log('🔊 Attempting to speak immediately...');
		try {
			window.speechSynthesis.speak(utterance);
			console.log('🔊 speechSynthesis.speak() called');
		} catch (error) {
			console.error('🔊 Error calling speechSynthesis.speak():', error);
		}

		// Also try with a delay as fallback
		setTimeout(() => {
			if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
				console.log('🔊 Retrying with delay...');
				try {
					window.speechSynthesis.speak(utterance);
					console.log('🔊 Retry speechSynthesis.speak() called');
				} catch (error) {
					console.error('🔊 Error on retry:', error);
				}
			}
		}, 500);
	}

	function stopSpeech() {
		if (isTTSSupported && window.speechSynthesis.speaking) {
			window.speechSynthesis.cancel();
			currentUtterance = null;
		}
	}

	function formatTime(date: Date) {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		}).format(date);
	}

	function getMessageWidth(message: Message): string {
		// User messages: fit content with reasonable max width
		if (message.isUser) {
			return 'max-w-[70%] w-fit';
		}

		// AI component responses: wider for components but still fit content
		if (message.aiDecision?.type === 'component') {
			return 'max-w-[80%]';
		}

		// Generic AI responses: fit content with reasonable max width
		return 'max-w-[70%] w-fit';
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

	function getConfirmationMessage(
		componentName: string,
		accountId?: string,
		accountType?: string
	): string {
		switch (componentName) {
			case 'accounts-overview':
				return "Here's an overview of all your bank accounts:";

			case 'account-header':
				if (accountType === 'pillar3a') {
					return 'Sure, here are the details for your 3rd pillar account:';
				} else if (accountType === 'savings') {
					return 'Here are the details for your savings account:';
				} else if (accountType === 'current') {
					return 'Here are the details for your current account:';
				}
				return 'Here are your account details:';

			case 'savings-profiles':
				return 'Here are your savings profiles and goals:';

			case 'savings-analysis':
				return "Here's an analysis of your savings performance:";

			case 'transaction-overview':
				return "Here's an overview of your recent transactions:";

			case 'transaction-stats':
				return 'Here are your transaction statistics:';

			case 'transaction-charts':
				return 'Here are visual charts of your transaction patterns:';

			case 'transaction-table':
				return "Here's a detailed table of your transactions:";

			case 'recurrent-payment-stats':
				return 'Here are statistics about your recurring payments:';

			case 'recurrent-payment-grid':
				return "Here's an overview of all your recurring payments:";

			case 'recurrent-payment-categories':
				return "Here's a breakdown of your recurring payments by category:";

			case 'upcoming-payments':
				return 'Here are your upcoming scheduled payments:';

			default:
				return "Here's the information you requested:";
		}
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
							<!-- Render each component -->
							{#each getComponents(message) as componentName}
								<div class="bg-background/5 rounded-t-lg overflow-hidden">
									<div class="py-2">
										<p class="text-sm text-muted-foreground p-2">
											{getConfirmationMessage(
												componentName,
												getAccountId(message),
												getAccountType(message)
											)}
										</p>
									</div>
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
