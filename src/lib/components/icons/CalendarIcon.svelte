<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<rect x="3" y="4" width="18" height="17" rx="2" />
	<path d="M16 2v4M8 2v4M3 10h18" />
</Icon>
