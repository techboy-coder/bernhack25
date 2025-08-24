<script lang="ts">
  import { Slide, Transition } from '@animotion/core';
  import { animate } from '$lib/waapi';

  let t1: HTMLParagraphElement;
</script>

<Slide class="h-full place-content-center place-items-center">
  <Transition
    do={async () => {
      t1.style.opacity = '0';
      await animate(
        t1,
        [
          { opacity: 0, transform: 'translateY(16px) scale(0.98)' },
          { opacity: 1, transform: 'translateY(0px) scale(1)' }
        ],
        { duration: 700, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
    }}
  >
    <p bind:this={t1} class="text-7xl md:text-8xl font-bold drop-shadow-sm text-center">
      Welcome ✨
    </p>
  </Transition>
</Slide>
