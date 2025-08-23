<script lang="ts">
  // Alle Attribute (inkl. class) vom Aufrufer holen
  let { class: className = '', children, ...rest } = $props();
</script>

<div class={`rounded-lg border p-4 ${className}`} {...rest}>
  {@render children?.()}
</div>
