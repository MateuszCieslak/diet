<script lang="ts">
	import '$lib/styles/base.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { pl } from '$lib/i18n/pl';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import BookIcon from '$lib/components/icons/BookIcon.svelte';
	import CarrotIcon from '$lib/components/icons/CarrotIcon.svelte';
	import CartIcon from '$lib/components/icons/CartIcon.svelte';

	let { children } = $props();

	const tabs = [
		{ href: '/plan', label: pl.nav.plan, icon: CalendarIcon },
		{ href: '/meals', label: pl.nav.meals, icon: BookIcon },
		{ href: '/ingredients', label: pl.nav.ingredients, icon: CarrotIcon },
		{ href: '/shopping-list', label: pl.nav.shopping, icon: CartIcon }
	];

	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{pl.appName}</title>
</svelte:head>

<main>
	{@render children()}
</main>

<nav aria-label={pl.nav.label}>
	<ul>
		{#each tabs as tab (tab.href)}
			<li>
				<a href={tab.href} aria-current={isActive(tab.href) ? 'page' : undefined}>
					<tab.icon />
					<span>{tab.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	main {
		max-width: var(--content-max-width);
		margin: 0 auto;
		/* Keep the last content above the fixed bottom navigation. */
		padding-bottom: calc(64px + env(safe-area-inset-bottom));
	}
	nav {
		position: fixed;
		inset: auto 0 0;
		z-index: 10;
		padding-bottom: env(safe-area-inset-bottom);
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: 0;
		list-style: none;
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 60px;
		color: var(--color-muted);
		font-size: var(--font-size-label);
		font-weight: 600;
		text-decoration: none;
	}
	a[aria-current='page'] {
		color: var(--color-accent);
	}
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
</style>
