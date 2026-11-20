<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>{pl.login.title} · {pl.appName}</title>
</svelte:head>

<div class="login">
	<form method="POST" use:enhance class="card stack">
		<h1>{pl.appName}</h1>
		<TextField
			type="password"
			name="password"
			label={pl.login.password}
			autocomplete="current-password"
			required
			error={form?.error ? pl.login[form.error] : undefined}
		/>
		<Button type="submit">{pl.login.submit}</Button>
	</form>
</div>

<style>
	.login {
		display: grid;
		place-items: center;
		min-height: 100dvh;
		padding: var(--gutter);
	}

	.card {
		width: 100%;
		max-width: 360px;
		padding: var(--space-6);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-title);
		font-weight: 700;
	}
</style>
