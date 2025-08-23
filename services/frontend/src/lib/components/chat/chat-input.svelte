<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from '$lib/utils.js';
	import CommandSuggestions from './command-suggestions.svelte';
	import UploadIcon from '@lucide/svelte/icons/paperclip';
	import MicrophoneIcon from '@lucide/svelte/icons/mic';
	import MicrophoneOffIcon from '@lucide/svelte/icons/mic-off';
	import SendIcon from '@lucide/svelte/icons/send';
	import { toast } from 'svelte-sonner';

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

	// Speech recognition state
	let isRecording = $state(false);
	let recognition: any = $state(null);
	let isSupported = $state(false);
	let audioStream: MediaStream | null = $state(null);
	let audioContext: AudioContext | null = $state(null);
	let analyser: AnalyserNode | null = $state(null);
	let audioLevelMonitoring = $state(false);
	let shouldAutoSubmit = $state(false); // Track if we should auto-submit when recording ends

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
			// Reset textarea height to minimum after sending
			if (textareaRef) {
				textareaRef.style.height = '30px';
			}
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

	// Check speech recognition support on mount
	$effect(() => {
		if (typeof window !== 'undefined') {
			const SpeechRecognition =
				(window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

			console.log('🔍 Speech Recognition API check:', {
				SpeechRecognition: !!SpeechRecognition,
				windowSpeechRecognition: !!(window as any).SpeechRecognition,
				webkitSpeechRecognition: !!(window as any).webkitSpeechRecognition
			});

			isSupported = !!SpeechRecognition;

			if (isSupported && !recognition) {
				console.log('🎙️ Initializing speech recognition...');
				recognition = new SpeechRecognition();

				// Configure speech recognition settings
				recognition.continuous = false; // Set to false for better reliability
				recognition.interimResults = true;
				recognition.lang = 'en-US';
				recognition.maxAlternatives = 1;

				recognition.onstart = () => {
					console.log('🎙️ Speech recognition started');
					isRecording = true;
					shouldAutoSubmit = true; // Enable auto-submit when we start recording
					startAudioLevelMonitoring();
					// toast.info('Listening... Speak now!');
				};

				recognition.onresult = (event: any) => {
					console.log('🎙️ Speech recognition onresult fired!');
					console.log('🎙️ Results:', event.results);

					let finalTranscript = '';
					let interimTranscript = '';

					// Process all results from the current session
					for (let i = 0; i < event.results.length; i++) {
						const result = event.results[i];
						const transcript = result[0].transcript;

						console.log(`Result ${i}:`, {
							transcript,
							isFinal: result.isFinal,
							confidence: result[0].confidence
						});

						if (result.isFinal) {
							finalTranscript += transcript;
						} else {
							interimTranscript += transcript;
						}
					}

					// Update the value with final transcript
					if (finalTranscript.trim()) {
						console.log('✅ Adding final transcription:', finalTranscript.trim());
						const currentValue = value.trim();
						const newTranscript = finalTranscript.trim();

						// Append to existing value or replace if empty
						if (currentValue) {
							value = currentValue + ' ' + newTranscript;
						} else {
							value = newTranscript;
						}

						// Auto-resize textarea and focus
						setTimeout(() => {
							autoResize();
							textareaRef?.focus();
						}, 0);
					}

					// Show interim results in console
					if (interimTranscript.trim()) {
						console.log('🔄 Interim transcript:', interimTranscript.trim());
					}
				};

				recognition.onerror = (event: any) => {
					console.error('❌ Speech recognition error:', event);
					isRecording = false;
					shouldAutoSubmit = false; // Disable auto-submit on error
					stopAudioLevelMonitoring();

					if (event.error === 'not-allowed') {
						toast.error('Microphone access denied. Please allow microphone permissions.');
					} else if (event.error === 'no-speech') {
						toast.warning('No speech detected. Please speak clearly.');
					} else if (event.error === 'aborted') {
						console.log('🛑 Speech recognition was aborted');
						shouldAutoSubmit = false; // User manually stopped, don't auto-submit
					} else if (event.error === 'audio-capture') {
						toast.error('Microphone not available. Please check your microphone.');
					} else if (event.error === 'network') {
						toast.error('Network error. Speech recognition requires internet connection.');
					} else {
						toast.error(`Speech recognition error: ${event.error}`);
					}
				};

				recognition.onend = () => {
					console.log('🎙️ Speech recognition ended');
					isRecording = false;
					stopAudioLevelMonitoring();

					// Auto-submit if we have text and should auto-submit
					if (shouldAutoSubmit && value.trim()) {
						console.log('🚀 Auto-submitting transcribed message:', value.trim());
						toast.success('Message sent automatically!');

						// Small delay to ensure UI updates properly
						setTimeout(() => {
							handleSend();
						}, 100);
					} else if (shouldAutoSubmit) {
						console.log('ℹ️ No text to auto-submit');
						toast.info('No speech was transcribed');
					}

					shouldAutoSubmit = false; // Reset auto-submit flag
				};

				recognition.onspeechstart = () => {
					console.log('🎙️ Speech detected');
					// toast.success('Speech detected! Continue speaking...');
				};

				recognition.onspeechend = () => {
					console.log('🎙️ Speech ended');
				};

				recognition.onsoundstart = () => {
					console.log('🎙️ Sound detected');
				};

				recognition.onsoundend = () => {
					console.log('🎙️ Sound ended');
				};

				recognition.onnomatch = () => {
					console.log('⚠️ No speech match found');
					toast.warning('Could not understand speech. Please try again.');
				};

				console.log('✅ Speech recognition initialized');
			}
		}
	});

	async function startAudioLevelMonitoring() {
		try {
			console.log('🎚️ Starting audio level monitoring...');
			audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(audioStream);
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			source.connect(analyser);

			audioLevelMonitoring = true;
			monitorAudioLevel();

			console.log('✅ Audio level monitoring started');
		} catch (error) {
			console.error('❌ Failed to start audio monitoring:', error);
			toast.error('Could not access microphone for audio monitoring.');
		}
	}

	function monitorAudioLevel() {
		if (!audioLevelMonitoring || !analyser) return;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		analyser.getByteFrequencyData(dataArray);
		const average = dataArray.reduce((a, b) => a + b) / bufferLength;
		const volume = Math.round((average / 255) * 100);

		if (volume > 0) {
			console.log(`🎚️ Audio level: ${volume}%`);
		}

		// Show warning if audio level is too low
		if (volume < 5 && isRecording) {
			console.log('⚠️ Audio level very low - try speaking louder or closer to microphone');
		}

		// Continue monitoring using requestAnimationFrame for better performance
		if (audioLevelMonitoring) {
			setTimeout(() => monitorAudioLevel(), 500);
		}
	}

	function stopAudioLevelMonitoring() {
		console.log('🎚️ Stopping audio level monitoring...');

		audioLevelMonitoring = false;

		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			audioStream = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}

		analyser = null;
		console.log('✅ Audio level monitoring stopped');
	}

	function handleMicrophoneClick() {
		if (!isSupported) {
			toast.error(
				'Speech recognition is not supported in your browser. Please use Chrome, Safari, or Edge.'
			);
			return;
		}

		if (!recognition) {
			toast.error('Speech recognition not initialized. Please refresh the page.');
			return;
		}

		console.log('🎙️ Microphone clicked, current state:', isRecording);

		if (isRecording) {
			// Stop recording - this will trigger onend and potentially auto-submit
			console.log('🛑 Stopping speech recognition...');
			recognition.stop();
			toast.info('Processing speech...');
		} else {
			// Start recording
			try {
				console.log('▶️ Starting speech recognition...');
				recognition.start();
			} catch (error) {
				console.error('Failed to start speech recognition:', error);
				toast.error('Failed to start voice recording. Please try again.');
			}
		}

		// Call the original callback if provided
		onMicrophoneClick?.();
	}
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
				placeholder={isRecording ? 'Listening... Speak now' : placeholder}
				class="resize-none border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
				style="min-height: 30px; max-height: 200px;"
				oninput={() => {
					handleInput();
					autoResize();
				}}
				onkeydown={handleKeyDown}
				disabled={disabled || isRecording}
				rows={1}
			/>
		</div>

		<!-- Action Buttons -->
		<div class="flex shrink-0 items-end gap-1">
			<!-- Microphone Button -->
			<Button
				variant="ghost"
				size="icon"
				class={cn(
					'transition-colors duration-200',
					isRecording
						? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100'
						: 'text-muted-foreground hover:text-foreground'
				)}
				onclick={handleMicrophoneClick}
				{disabled}
				title={isRecording ? 'Stop recording' : 'Start voice recording'}
			>
				{#if isRecording}
					<MicrophoneOffIcon class="size-4 animate-pulse" />
				{:else}
					<MicrophoneIcon class="size-4" />
				{/if}
				<span class="sr-only">{isRecording ? 'Stop recording' : 'Voice input'}</span>
			</Button>

			<!-- Send Button -->
			<Button
				size="icon"
				class="bg-primary text-primary-foreground hover:bg-primary/90"
				onclick={handleSend}
				disabled={disabled || !value.trim() || isRecording}
			>
				<SendIcon class="size-4" />
				<span class="sr-only">Send message</span>
			</Button>
		</div>
	</div>
</div>
