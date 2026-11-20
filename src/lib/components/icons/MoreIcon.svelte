<script lang="ts">
	import Icon from './Icon.svelte';

	let { size }: { size?: number } = $props();
</script>

<Icon {size}>
	<circle cx="5" cy="12" r="1" />
	<circle cx="12" cy="12" r="1" />
	<circle cx="19" cy="12" r="1" />
</Icon>
