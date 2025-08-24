<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';

  let t3: HTMLParagraphElement;
</script>

<Slide class="h-full place-content-center place-items-center">
  <Transition
    do={async () => {
      t3.style.opacity = '0';
      await animate(
        t3,
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0px)' }
        ],
        { duration: 650, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
    }}
  >
    <p bind:this={t3} class="text-6xl md:text-7xl font-bold drop-shadow-sm text-center">
      Thanks for watching
    </p>
  </Transition>
</Slide>
