<script lang="ts">
	import { enhance } from '$app/forms';
	import { pl } from '$lib/i18n/pl';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>{pl.login.title} · {pl.appName}</title>
</svelte:head>

<main class="login">
	<form method="POST" use:enhance class="card stack">
		<h1>{pl.appName}</h1>
		<label class="stack field">
			<span>{pl.login.password}</span>
			<input
				type="password"
				name="password"
				autocomplete="current-password"
				required
				aria-invalid={form?.error ? 'true' : undefined}
				aria-describedby={form?.error ? 'login-error' : undefined}
			/>
		</label>
		{#if form?.error}
			<p id="login-error" class="error" role="alert">{pl.login[form.error]}</p>
		{/if}
		<button type="submit">{pl.login.submit}</button>
	</form>
</main>

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

	.field {
		gap: var(--space-2);
		font-size: var(--font-size-secondary);
		font-weight: 500;
	}

	input {
		min-height: var(--touch-target);
		padding: 0 var(--space-3);
		background: var(--color-bg);
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		color: var(--color-ink);
	}

	.error {
		margin: 0;
		color: var(--color-ink);
		font-size: var(--font-size-secondary);
	}

	button {
		min-height: var(--touch-target);
		background: var(--color-accent);
		border: none;
		border-radius: var(--radius-md);
		color: var(--color-surface);
		font-weight: 600;
		cursor: pointer;
	}

	button:hover {
		background: var(--color-accent-hover);
	}
</style>
