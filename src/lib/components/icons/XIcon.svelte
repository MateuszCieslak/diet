<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<path d="M18 6 6 18M6 6l12 12" />
</Icon>
