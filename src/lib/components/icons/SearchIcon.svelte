<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<circle cx="11" cy="11" r="7" />
	<path d="m20 20-3.5-3.5" />
</Icon>
