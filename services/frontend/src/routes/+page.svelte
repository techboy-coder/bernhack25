<script lang="ts">
	import ChatInput from '$lib/components/chat/chat-input.svelte';
	import ChatMessages from '$lib/components/chat/chat-messages.svelte';

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

	let messages: Message[] = $state([]);
	let inputValue = $state('');

	function handleSend(message: string) {
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

		// Simulate AI response
		setTimeout(() => {
			const aiResponse: Message = {
				id: crypto.randomUUID(),
				content: `I received your message: "${message}". This is a demo response from the AI assistant.`,
				author: {
					name: 'Assistant',
					avatar: undefined
				},
				timestamp: new Date(),
				isUser: false
			};
			messages = [...messages, aiResponse];
		}, 1000);
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
	<title>Chat - AI Assistant</title>
</svelte:head>

<div
	class="dark h-screen bg-gradient-to-br from-background via-background to-primary/10 p-4 overflow-hidden"
>
	<div class="mx-auto flex h-full max-w-4xl flex-col">
		<!-- Header -->
		<header class="border-border flex items-center justify-between border-b px-6 py-4">
			<div class="flex items-center gap-3">
				<div
					class="bg-primary flex size-8 items-center justify-center rounded-lg text-primary-foreground"
				>
					<span class="text-sm font-semibold">AI</span>
				</div>
				<div>
					<h1 class="text-foreground text-lg font-semibold">AI Chat Assistant</h1>
					<p class="text-muted-foreground text-xs">Powered by advanced AI models</p>
				</div>
			</div>
			<div class="text-muted-foreground text-xs">
				{messages.length} messages
			</div>
		</header>

		<!-- Messages Area -->
		<div
			class="flex-1 h-[70vh] overflow-y-scroll [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:'none']"
		>
			<ChatMessages {messages} />
		</div>

		<!-- Chat Input Area -->
		<div class="p-4 backdrop-blur-sm rounded-xl">
			<div class="mx-auto max-w-3xl">
				<ChatInput
					bind:value={inputValue}
					onSend={handleSend}
					onFileUpload={handleFileUpload}
					onMicrophoneClick={handleMicrophoneClick}
					placeholder="Ask me anything... Use / for commands"
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
