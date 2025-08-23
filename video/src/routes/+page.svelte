<script lang="ts">
  import { Presentation } from '@animotion/core';
  import BG from '$lib/BG.svelte';

  import Slide1 from '$lib/slides/Welcome.svelte';
  import Slide2 from '$lib/slides/blocks.svelte';
  import Slide3 from '$lib/slides/bubbles.svelte';
  import Slide4 from '$lib/slides/food.svelte';
  import Slide5 from '$lib/slides/goals.svelte';
  import Slide6 from '$lib/slides/graphs.svelte';
  import Slide7 from '$lib/slides/map.svelte';
  import Slide8 from '$lib/slides/End.svelte';

  const deckColors = ['#00ffff', '#7c3aed', '#22d3ee'];
</script>

<!-- Persistent animated background -->
<BG colors={deckColors} duration={700} />

<Presentation options={{ history: true, transition: 'slide', controls: true, progress: true }}>
  <Slide1 />
  <Slide2 />
  <Slide3 />
  <Slide4 />
  <Slide5 />
  <Slide6 />
  <Slide7 />
  <Slide8 />

</Presentation>
