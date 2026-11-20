<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<path d="m9 18 6-6-6-6" />
</Icon>
