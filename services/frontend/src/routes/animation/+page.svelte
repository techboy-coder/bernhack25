<script lang="ts">
	import { Presentation, Slide, Action, Transition } from '@animotion/core';

	// State for managing which items are visible
	let showItem1 = $state(false);
	let showItem2 = $state(false);
	let showItem3 = $state(false);
	let showItem4 = $state(false);
</script>

<svelte:head>
	<title>Animotion Test - Step by Step List</title>
</svelte:head>

<Presentation>
	<Slide class="h-full place-content-center place-items-center">
		<div class="grid grid-cols-4 grid-rows-2 gap-4 text-white">
			{#each Array.from({ length: 100 }, (_, i) => i + 1) as item, index}
				<Transition order={100 - index} visible={index === 99}>{item}</Transition>
			{/each}
		</div>
	</Slide>
</Presentation>
