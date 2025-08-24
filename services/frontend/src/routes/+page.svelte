<script lang="ts">
	import ChatInput from '$lib/components/chat/chat-input.svelte';
	import ChatMessages from '$lib/components/chat/chat-messages.svelte';
	import { analyzeUserInput, type AIDecision, type UserMessage } from '$lib/api.js';

	interface Message {
		id: string;
		content: string;
		author: {
			name: string;
			avatar?: string;
		};
		timestamp: Date;
		isUser: boolean;
		aiDecision?: AIDecision; // Add AI decision data
	}

	let messages: Message[] = $state([]);
	let inputValue = $state('');
	let isLoading = $state(false);
	let messagesContainerRef: HTMLElement | null = $state(null);
	let ttsEnabled = $state(true);
	let isSpeaking = $state(false);

	// Track TTS state from ChatMessages component
	function handleTTSStateChange(speaking: boolean) {
		isSpeaking = speaking;
	}

	function toggleTTS() {
		ttsEnabled = !ttsEnabled;
	}

	function stopTTS() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			window.speechSynthesis.cancel();
			isSpeaking = false;
		}
	}

	function testTTS() {
		if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
			const utterance = new SpeechSynthesisUtterance(
				'This is a test of the text-to-speech functionality.'
			);
			window.speechSynthesis.speak(utterance);
		}
	}

	// Auto-scroll to bottom when messages change
	$effect(() => {
		if (messagesContainerRef && messages.length > 0) {
			// Use setTimeout to ensure DOM has updated
			setTimeout(() => {
				if (messagesContainerRef) {
					messagesContainerRef.scrollTop = messagesContainerRef.scrollHeight;
				}
			}, 100);
		}
	});

	// Also auto-scroll when loading state changes (for smooth transition when AI responds)
	$effect(() => {
		if (messagesContainerRef && !isLoading && messages.length > 0) {
			setTimeout(() => {
				if (messagesContainerRef) {
					messagesContainerRef.scrollTop = messagesContainerRef.scrollHeight;
				}
			}, 100);
		}
	});

	async function handleSend(message: string) {
		// Check if this is a component command
		if (message.startsWith('/cmd.')) {
			handleComponentCommand(message);
			return;
		}

		const newMessage: Message = {
			id: crypto.randomUUID(),
			content: message,
			author: {
				name: 'You',
				avatar: undefined
			},
			timestamp: new Date(),
			isUser: true
		};

		messages = [...messages, newMessage];
		isLoading = true;

		try {
			// Convert messages to UserMessage format for AI
			const history: UserMessage[] = messages.slice(-10).map((msg) => ({
				id: msg.id,
				content: msg.content,
				timestamp: msg.timestamp.getTime(),
				isUser: msg.isUser
			}));

			// Get AI response
			const aiResponse = await analyzeUserInput(history, message);

			if (aiResponse.success) {
				const aiMessage: Message = {
					id: crypto.randomUUID(),
					content: Array.isArray(aiResponse.decision.content)
						? aiResponse.decision.content.join('\n')
						: aiResponse.decision.content,
					author: {
						name: 'Ueli',
						avatar: undefined
					},
					timestamp: new Date(),
					isUser: false,
					aiDecision: aiResponse.decision
				};

				messages = [...messages, aiMessage];
			} else {
				throw new Error(aiResponse.error || 'AI request failed');
			}
		} catch (error) {
			console.error('AI Error:', error);
			const errorMessage: Message = {
				id: crypto.randomUUID(),
				content: 'Sorry, I encountered an error processing your request. Please try again.',
				author: {
					name: 'Ueli',
					avatar: undefined
				},
				timestamp: new Date(),
				isUser: false
			};
			messages = [...messages, errorMessage];
		} finally {
			isLoading = false;
		}
	}

	function handleComponentCommand(command: string) {
		const userMessage: Message = {
			id: crypto.randomUUID(),
			content: command,
			author: {
				name: 'You',
				avatar: undefined
			},
			timestamp: new Date(),
			isUser: true
		};

		// Map command to component and account type
		let componentName: string;
		let accountType: string | undefined;
		let confirmationText: string;

		switch (command) {
			case '/cmd.accounts':
				componentName = 'accounts-overview';
				confirmationText = "Here's an overview of all your bank accounts:";
				break;
			case '/cmd.personal':
				componentName = 'account-header';
				accountType = 'personal';
				confirmationText = 'Here are the details for your personal checking account:';
				break;
			case '/cmd.savings':
				componentName = 'account-header';
				accountType = 'savings';
				confirmationText = 'Here are the details for your savings account:';
				break;
			case '/cmd.retirement':
				componentName = 'account-header';
				accountType = 'retirement';
				confirmationText = 'Here are the details for your retirement account:';
				break;
			case '/cmd.marriage':
				componentName = 'account-header';
				accountType = 'marriage';
				confirmationText = 'Here are the details for your marriage fund account:';
				break;
			case '/cmd.transactions':
				componentName = 'transaction-table';
				accountType = 'personal';
				confirmationText = "Here's a detailed table of your transactions:";
				break;
			case '/cmd.txstats':
				componentName = 'transaction-stats';
				accountType = 'personal';
				confirmationText = 'Here are your transaction statistics:';
				break;
			case '/cmd.txcharts':
				componentName = 'transaction-charts';
				accountType = 'personal';
				confirmationText = 'Here are visual charts of your transaction patterns:';
				break;
			case '/cmd.txoverview':
				componentName = 'transaction-overview';
				accountType = 'personal';
				confirmationText = "Here's an overview of your recent transactions:";
				break;
			case '/cmd.savings-goals':
				componentName = 'savings-profiles';
				confirmationText = 'Here are your savings profiles and goals:';
				break;
			case '/cmd.savings-analysis':
				componentName = 'savings-analysis';
				confirmationText = "Here's an analysis of your savings performance:";
				break;
			case '/cmd.recurring':
				componentName = 'recurrent-payment-grid';
				confirmationText = "Here's a grid view of all your recurring payments:";
				break;
			case '/cmd.recurring-stats':
				componentName = 'recurrent-payment-stats';
				confirmationText = 'Here are statistics about your recurring payments:';
				break;
			case '/cmd.recurring-cats':
				componentName = 'recurrent-payment-categories';
				confirmationText = 'Here are your recurring payments organized by category:';
				break;
			case '/cmd.upcoming':
				componentName = 'upcoming-payments';
				confirmationText = 'Here are your upcoming recurring payments:';
				break;
			default:
				// Unknown command
				const errorMessage: Message = {
					id: crypto.randomUUID(),
					content: `Unknown command: ${command}. Type /help to see available commands.`,
					author: {
						name: 'Ueli',
						avatar: undefined
					},
					timestamp: new Date(),
					isUser: false
				};
				messages = [...messages, userMessage, errorMessage];
				return;
		}

		// Create AI decision for component
		const aiDecision: AIDecision = {
			type: 'component',
			content: componentName,
			accountType: accountType as any,
			ttsText: confirmationText,
			reasoning: 'Manual component command invoked by user'
		};

		const aiMessage: Message = {
			id: crypto.randomUUID(),
			content: confirmationText,
			author: {
				name: 'Ueli',
				avatar: undefined
			},
			timestamp: new Date(),
			isUser: false,
			aiDecision
		};

		messages = [...messages, userMessage, aiMessage];
	}

	function handleFileUpload() {
		console.log('File upload clicked');
		// TODO: Implement file upload
	}

	function handleMicrophoneClick() {
		console.log('Microphone clicked');
		// TODO: Implement speech-to-text
	}
</script>

<svelte:head>
	<title>Ueli - AI Banking Assistant</title>
</svelte:head>

<div
	class="dark h-screen bg-gradient-to-br from-background via-background to-primary/12 p-4 overflow-hidden"
>
	<div class="mx-auto flex h-full flex-col">
		<!-- Header -->
		<header class="border-border flex items-center justify-between border-b px-6 py-4">
			<div class="flex items-center gap-3 pb-[4px]">
				<div>
					<h1 class="text-foreground text-lg font-semibold">Ueli - Banking Assistant</h1>
					<p class="text-muted-foreground text-xs">Your AI-powered financial companion</p>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- TTS Controls -->
				<div class="flex items-center gap-2">
					<button
						onclick={toggleTTS}
						class="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors hover:bg-accent"
						class:text-primary={ttsEnabled}
						class:text-muted-foreground={!ttsEnabled}
						title={ttsEnabled ? 'Disable text-to-speech' : 'Enable text-to-speech'}
					>
						<span class="text-sm">{ttsEnabled ? '🔊' : '🔇'}</span>
						<span>TTS</span>
					</button>

					{#if isSpeaking}
						<button
							onclick={stopTTS}
							class="flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors hover:bg-accent text-red-500"
							title="Stop speaking"
						>
							<span class="text-sm">⏹️</span>
							<span>Stop</span>
						</button>
					{/if}
				</div>

				<div class="text-muted-foreground text-xs">
					{messages.length} messages
				</div>
			</div>
		</header>

		<!-- Messages Area -->
		<div
			class="flex-1 h-[70vh] overflow-y-scroll [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:'none']"
			bind:this={messagesContainerRef}
		>
			<ChatMessages {messages} {isLoading} {ttsEnabled} onTTSStateChange={handleTTSStateChange} />
		</div>

		<!-- Chat Input Area -->
		<div class="p-4 backdrop-blur-sm rounded-xl">
			<div class="mx-auto max-w-3xl">
				<ChatInput
					bind:value={inputValue}
					onSend={handleSend}
					onFileUpload={handleFileUpload}
					onMicrophoneClick={handleMicrophoneClick}
					placeholder="Ask about your finances... Use / for commands"
					disabled={isLoading}
				/>
				<div class="pt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
					<span>Press Enter to send</span>
					<span>•</span>
					<span>Shift + Enter for new line</span>
					<span>•</span>
					<span>Use / for commands</span>
				</div>
			</div>
		</div>
	</div>
</div>
