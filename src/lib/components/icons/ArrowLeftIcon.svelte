<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<path d="M19 12H5M12 19l-7-7 7-7" />
</Icon>
