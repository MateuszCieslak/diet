<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<circle cx="12" cy="12" r="8" />
</Icon>
