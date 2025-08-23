<script lang="ts">
	import { Presentation, Slide } from '@animotion/core';
</script>

<svelte:head>
	<title>Animotion Test - 2 Slides</title>
</svelte:head>

<Presentation>
	<!-- Slide 1 -->
	<Slide>
		<div
			class="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white"
		>
			<h1 class="text-6xl font-bold mb-8">Welcome to Animotion</h1>
			<p class="text-2xl text-center max-w-2xl mb-8">
				This is slide 1 - a simple test of the Animotion presentation framework
			</p>
			<div class="mt-8 p-4 bg-white/20 rounded-lg">
				<p class="text-lg">✨ Beautiful animations</p>
				<p class="text-lg">🎯 Easy to use</p>
				<p class="text-lg">⚡ Powered by Svelte</p>
			</div>
		</div>
	</Slide>

	<!-- Slide 2 -->
	<Slide>
		<div
			class="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-green-500 to-teal-600 text-white"
		>
			<h1 class="text-6xl font-bold mb-8">Slide Number Two</h1>
			<p class="text-2xl text-center max-w-2xl mb-8">
				This is slide 2 - testing navigation between slides
			</p>
			<div class="grid grid-cols-2 gap-8 mb-8">
				<div class="p-6 bg-white/20 rounded-lg text-center">
					<div class="text-4xl mb-4">📊</div>
					<h3 class="text-xl font-semibold">Data Visualization</h3>
				</div>
				<div class="p-6 bg-white/20 rounded-lg text-center">
					<div class="text-4xl mb-4">🎨</div>
					<h3 class="text-xl font-semibold">Beautiful Design</h3>
				</div>
			</div>
			<div class="text-center">
				<p class="text-lg opacity-80">Use arrow keys to navigate between slides</p>
			</div>
		</div>
	</Slide>
</Presentation>
