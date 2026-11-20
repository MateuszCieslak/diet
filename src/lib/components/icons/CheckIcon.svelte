<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<path d="M5 12.5l4.5 4.5L19 7.5" />
</Icon>
