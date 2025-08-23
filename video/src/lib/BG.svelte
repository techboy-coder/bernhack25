<script lang="ts">
  // props (runes)
  let { colors = ['#00ffff', '#ffb833ff', '#2f283aff'], duration = 700 } = $props<{
    colors?: string[];
    duration?: number;
  }>();

  // stateful values
  let aColors = $state<string[]>([]);
  let bColors = $state<string[]>([]);
  let showB   = $state(false);
  let primed  = $state(false);
  let lastSig = $state('');

  // derived value (replaces `$: sig = ...`)
  const sig = $derived(colors?.join('|') ?? '');

  // effect (replaces the `$:` reactive block)
  $effect(() => {
    if (sig && sig !== lastSig) {
      lastSig = sig;

      if (!primed) {
        aColors = colors;
        primed = true;
      } else {
        if (showB) {
          aColors = colors;
          showB = false; // fade B -> A
        } else {
          bColors = colors;
          showB = true;  // fade A -> B
        }
      }
    }
  });

  const spots = [
    { top: '-15%', left: '-10%' },
    { top: '40%', right: '-10%' },
    { bottom: '-20%', left: '20%' }
  ];
</script>

<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
  <!-- Subtle base backdrop so 'screen' blending lights up on dark pages -->
  <div
    class="absolute inset-0"
    style="background:radial-gradient(60% 60% at 50% 50%, #ffffff 0%, #e6e6ff 30%, #000000 100%); opacity:.18;"
  ></div>

  <!-- Layer A -->
  <div
    class="absolute inset-0 transition-opacity ease-out"
    style="opacity:{showB ? 0 : 1}; transition-duration:{duration}ms;"
  >
    {#each aColors as c, i}
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div
        class="blob"
        style:background={c}
        style:top={spots[i]?.top}
        style:right={spots[i]?.right}
        style:bottom={spots[i]?.bottom}
        style:left={spots[i]?.left}
      />
    {/each}
  </div>

  <!-- Layer B -->
  <div
    class="absolute inset-0 transition-opacity ease-out"
    style="opacity:{showB ? 1 : 0}; transition-duration:{duration}ms;"
  >
    {#each bColors as c, i}
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div
        class="blob"
        style:background={c}
        style:top={spots[i]?.top}
        style:right={spots[i]?.right}
        style:bottom={spots[i]?.bottom}
        style:left={spots[i]?.left}
      />
    {/each}
  </div>

  <!-- gentle vignette -->
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div
    class="absolute inset-0"
    style="background:radial-gradient(80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,.15) 100%);"
  />
</div>

<style>
  .blob {
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 9999px;
    opacity: .4;
    filter: blur(60px);
    mix-blend-mode: screen;
  }

  /* Utility classes kept local so component is standalone */
  .fixed { position: fixed }
  .absolute { position: absolute }
  .inset-0 { inset: 0 }
  .-z-10 { z-index: -10 }
  .overflow-hidden { overflow: hidden }
  .pointer-events-none { pointer-events: none }
  .transition-opacity { transition-property: opacity }
  .ease-out { transition-timing-function: cubic-bezier(0,0,0.2,1) }
</style>
