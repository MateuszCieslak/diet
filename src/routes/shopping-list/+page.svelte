<script lang="ts">
	import * as v from 'valibot';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import { units } from '$lib/config/units';
	import AmountPill from '$lib/components/AmountPill.svelte';
	import { pl } from '$lib/i18n/pl';
	import { createListPoller } from '$lib/list-poller';
	import { formatAmount } from '$lib/nutrition';
	import { formErrors } from '$lib/schemas/common';
	import type { Ingredient, IngredientPage } from '$lib/schemas/ingredient';
	import { searchDebounceMs, searchTerm } from '$lib/search';
	import {
		ingredientItemSchema,
		itemPatchSchema,
		manualItemSchema,
		type ItemPatch
	} from '$lib/schemas/shopping';
	import { groupShoppingItems, type ShoppingItemView } from '$lib/shopping-view';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	/** The list lives on the client; local changes and polling overwrite it, a new `load` resets it. */
	let items = $derived(data.items);
	const grouped = $derived(groupShoppingItems(items));

	let error = $state<string | null>(null);

	let newName = $state('');
	let newAmount = $state('');
	let newUnit = $state('');
	let addErrors = $state<Record<string, string>>({});
	let adding = $state(false);
	let nameInput = $state<HTMLInputElement>();
	let amountInput = $state<HTMLInputElement>();

	/** The ingredient picked from the suggestions; editing the name unlinks it. */
	let linked = $state<Ingredient | null>(null);
	let suggestions = $state<Ingredient[]>([]);
	let suggestionsOpen = $state(false);
	let activeIndex = $state(-1);
	const suggestionsId = $props.id();

	const maxSuggestions = 6;

	let editingId = $state<number | null>(null);
	let amountDraft = $state('');
	let amountError = $state<string | null>(null);

	const poller = createListPoller({
		intervalMs: 5000,
		fetchList: async () => {
			const res = await fetch('/api/shopping-list');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return (await res.json()) as ShoppingItemView[];
		},
		onData: (list) => (items = list),
		// Only phones refresh, only while visible, and never while an amount is being typed.
		isActive: () =>
			matchMedia('(pointer: coarse)').matches &&
			document.visibilityState === 'visible' &&
			editingId === null
	});

	$effect(() => {
		poller.start();
		const onVisibility = () => {
			if (document.visibilityState === 'visible') void poller.tick();
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			poller.stop();
			document.removeEventListener('visibilitychange', onVisibility);
		};
	});

	$effect(() => {
		const q = searchTerm(newName);
		if (q === '' || linked) {
			suggestions = [];
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				suggestions = ((await res.json()) as IngredientPage).items.slice(0, maxSuggestions);
				activeIndex = -1;
			} catch (e) {
				if (controller.signal.aborted) return;
				// Suggestions are optional: without them the row still adds a manual item.
				console.error(e);
				suggestions = [];
			}
		}, searchDebounceMs);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	const showSuggestions = $derived(suggestionsOpen && suggestions.length > 0);

	function pickSuggestion(ingredient: Ingredient) {
		linked = ingredient;
		newName = ingredient.name;
		suggestionsOpen = false;
		activeIndex = -1;
		amountInput?.focus();
	}

	function handleNameKeydown(event: KeyboardEvent) {
		if (!showSuggestions) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = (activeIndex + 1) % suggestions.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
		} else if (event.key === 'Enter' && activeIndex >= 0) {
			event.preventDefault();
			pickSuggestion(suggestions[activeIndex]);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			suggestionsOpen = false;
		}
	}

	function amountText(item: ShoppingItemView): string {
		if (item.amount === null) return '';
		// Items without a unit are counted like pieces: at most 1 decimal.
		const amount = formatAmount(item.amount, item.unit ?? 'pcs');
		return item.unit ? `${amount} ${pl.units[item.unit]}` : amount;
	}

	function replaceItem(updated: ShoppingItemView) {
		items = items.map((i) => (i.id === updated.id ? updated : i));
	}

	/** A quick add may return an existing row with a larger amount, so it replaces that row. */
	function upsertItem(item: ShoppingItemView) {
		items = [...items.filter((i) => i.id !== item.id), item];
	}

	/** Applies `patch` optimistically, then saves it; on failure the item is rolled back. */
	async function patch(item: ShoppingItemView, body: ItemPatch) {
		const before = item;
		replaceItem({ ...item, ...body });
		error = null;
		const end = poller.beginMutation();
		try {
			const res = await fetch(`/api/shopping-list/items/${item.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			replaceItem(await res.json());
		} catch {
			replaceItem(before);
			error = pl.shopping.saveFailed;
		} finally {
			end();
		}
	}

	function startEditing(item: ShoppingItemView) {
		editingId = item.id;
		amountDraft = item.amount === null ? '' : String(item.amount).replace('.', ',');
		amountError = null;
	}

	function stopEditing() {
		editingId = null;
		amountError = null;
	}

	function saveAmount(item: ShoppingItemView) {
		if (editingId !== item.id) return;
		const blank = amountDraft.trim() === '';
		const parsed = v.safeParse(itemPatchSchema, { amount: blank ? null : amountDraft });
		if (!parsed.success) {
			amountError = parsed.issues[0].message;
			return;
		}
		stopEditing();
		if (parsed.output.amount !== item.amount) void patch(item, parsed.output);
	}

	async function addItem(event: SubmitEvent) {
		event.preventDefault();
		const parsed = linked
			? v.safeParse(ingredientItemSchema, { ingredientId: linked.id, amount: newAmount })
			: v.safeParse(manualItemSchema, { name: newName, amount: newAmount, unit: newUnit });
		if (!parsed.success) {
			addErrors = formErrors(parsed.issues);
			return;
		}
		addErrors = {};
		error = null;
		adding = true;
		const end = poller.beginMutation();
		try {
			const res = await fetch('/api/shopping-list/items', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(parsed.output)
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			upsertItem(await res.json());
			linked = null;
			suggestionsOpen = false;
			newName = '';
			newAmount = '';
			newUnit = '';
			nameInput?.focus();
		} catch {
			error = pl.shopping.addFailed;
		} finally {
			adding = false;
			end();
		}
	}
</script>

<svelte:head>
	<title>{pl.shopping.title} · {pl.appName}</title>
</svelte:head>

<header class="header">
	<div class="title-row">
		<h1>{pl.shopping.title}</h1>
		<a class="from-plan" href="/shopping-list/from-plan">
			<CalendarIcon size={18} />
			{pl.shopping.fromPlan}
		</a>
	</div>
	<form class="quick-add" onsubmit={addItem} novalidate>
		<div class="name">
			<label>
				<span class="visually-hidden">{pl.shopping.name}</span>
				<input
					bind:this={nameInput}
					bind:value={newName}
					oninput={() => {
						linked = null;
						suggestionsOpen = true;
					}}
					onkeydown={handleNameKeydown}
					onblur={() => (suggestionsOpen = false)}
					placeholder={pl.shopping.namePlaceholder}
					maxlength={120}
					autocomplete="off"
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={showSuggestions}
					aria-controls={suggestionsId}
					aria-activedescendant={showSuggestions && activeIndex >= 0
						? `${suggestionsId}-${activeIndex}`
						: undefined}
					aria-invalid={addErrors.name ? 'true' : undefined}
				/>
			</label>
			<ul
				id={suggestionsId}
				class="suggestions"
				role="listbox"
				aria-label={pl.shopping.suggestions}
				hidden={!showSuggestions}
			>
				{#each suggestions as ingredient, index (ingredient.id)}
					<!-- The input keeps focus and handles the keyboard (combobox pattern). -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="{suggestionsId}-{index}"
						role="option"
						aria-selected={index === activeIndex}
						onpointerdown={(e) => e.preventDefault()}
						onclick={() => pickSuggestion(ingredient)}
					>
						<span class="suggestion-name">{ingredient.name}</span>
						<span class="suggestion-meta">
							{pl.categories[ingredient.category]} · {pl.units[ingredient.unit]}
						</span>
					</li>
				{/each}
			</ul>
		</div>
		<label>
			<span class="visually-hidden">{pl.shopping.amount}</span>
			<input
				bind:this={amountInput}
				class="amount"
				bind:value={newAmount}
				inputmode="decimal"
				placeholder={pl.shopping.amount}
				autocomplete="off"
				aria-invalid={addErrors.amount ? 'true' : undefined}
			/>
		</label>
		{#if linked}
			<span class="unit-label">{pl.units[linked.unit]}</span>
		{:else}
			<label>
				<span class="visually-hidden">{pl.shopping.unit}</span>
				<select bind:value={newUnit}>
					<option value="">{pl.shopping.noUnit}</option>
					{#each units as unit (unit)}
						<option value={unit}>{pl.units[unit]}</option>
					{/each}
				</select>
			</label>
		{/if}
		<button class="add" type="submit" aria-label={pl.shopping.addLabel} disabled={adding}>
			<PlusIcon size={20} />
		</button>
	</form>
	{#if addErrors.name || addErrors.amount || addErrors.unit || addErrors.ingredientId}
		<p class="error" role="alert">
			{addErrors.name ?? addErrors.amount ?? addErrors.unit ?? addErrors.ingredientId}
		</p>
	{/if}
</header>

<div class="content stack">
	{#if error}
		<p class="error banner" role="alert">{error}</p>
	{/if}

	{#if items.length === 0}
		<p class="muted empty">{pl.shopping.empty}</p>
	{/if}

	{#each grouped.open as group (group.key)}
		<section class="group">
			<h2 class="section-label">{pl.categories[group.key]}</h2>
			<ul class="card">
				{#each group.items as item (item.id)}
					<li>
						<button
							class="tick"
							aria-pressed="false"
							aria-label={pl.shopping.tick(item.name)}
							onclick={() => patch(item, { done: true })}
						>
							<span class="box" aria-hidden="true"></span>
						</button>
						<span class="name">{item.name}</span>
						{#if editingId === item.id}
							<input
								class="amount-edit"
								inputmode="decimal"
								aria-label={pl.shopping.amountFor(item.name)}
								aria-invalid={amountError ? 'true' : undefined}
								bind:value={amountDraft}
								{@attach (el) => el.focus()}
								onblur={() => saveAmount(item)}
								onkeydown={(e) => {
									if (e.key === 'Enter') saveAmount(item);
									else if (e.key === 'Escape') stopEditing();
								}}
							/>
						{:else}
							<AmountPill
								name={item.name}
								text={amountText(item)}
								onclick={() => startEditing(item)}
							/>
						{/if}
					</li>
					{#if editingId === item.id && amountError}
						<li class="row-error" role="alert">{amountError}</li>
					{/if}
				{/each}
			</ul>
		</section>
	{/each}

	{#if grouped.done.length > 0}
		<section class="group">
			<h2 class="section-label">{pl.shopping.done(grouped.done.length)}</h2>
			<ul class="card done">
				{#each grouped.done as item (item.id)}
					<li>
						<button
							class="tick"
							aria-pressed="true"
							aria-label={pl.shopping.untick(item.name)}
							onclick={() => patch(item, { done: false })}
						>
							<span class="box checked" aria-hidden="true"><CheckIcon size={14} /></span>
						</button>
						<span class="name">{item.name}</span>
						<span class="done-amount">{amountText(item)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-5) var(--gutter) var(--space-3);
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
	}
	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
	}
	h1 {
		margin: 0;
		font-size: var(--font-size-title);
		font-weight: 700;
	}
	.from-plan {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: var(--touch-target);
		padding: 0 14px;
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-pill);
		color: var(--color-accent);
		font-size: var(--font-size-secondary);
		font-weight: 600;
		text-decoration: none;
	}
	.from-plan:hover {
		background: var(--color-accent-soft);
	}
	.quick-add {
		/* The suggestions dropdown spans the whole row. */
		position: relative;
		display: flex;
		gap: 6px;
	}
	.quick-add .name {
		flex: 1;
		min-width: 0;
	}
	.suggestions {
		position: absolute;
		z-index: 10;
		top: calc(100% + 4px);
		right: 0;
		left: 0;
		margin: 0;
		padding: 0;
		overflow: hidden;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
	}
	.suggestions[hidden] {
		display: none;
	}
	.suggestions li {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 2px;
		min-height: var(--touch-target);
		padding: 6px var(--space-3);
		cursor: pointer;
	}
	.suggestions li[aria-selected='true'],
	.suggestions li:hover {
		background: var(--color-accent-soft);
	}
	.suggestion-name {
		font-weight: 600;
	}
	.suggestion-meta {
		color: var(--color-muted);
		font-size: var(--font-size-secondary);
	}
	.unit-label {
		display: flex;
		align-items: center;
		min-width: 44px;
		padding: 0 6px;
		color: var(--color-muted);
		font-weight: 600;
	}
	.quick-add input,
	.quick-add select {
		height: 46px;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-ink);
	}
	.quick-add input {
		width: 100%;
		padding: 0 var(--space-3);
	}
	.quick-add input.amount {
		width: 72px;
		padding: 0 10px;
	}
	.quick-add select {
		padding: 0 6px;
	}
	.quick-add [aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.add {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 46px;
		height: 46px;
		border: 0;
		border-radius: var(--radius-md);
		background: var(--color-accent);
		color: var(--color-surface);
		cursor: pointer;
	}
	.add:hover {
		background: var(--color-accent-hover);
	}
	.add:disabled {
		opacity: 0.5;
	}
	.content {
		padding: var(--space-3) var(--gutter) var(--space-4);
	}
	.empty {
		margin: var(--space-6) 0;
		text-align: center;
	}
	.error {
		margin: 0;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.group h2 {
		padding: 0 var(--space-1);
	}
	.card {
		margin: 0;
		padding: 0;
		overflow: hidden;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: 14px;
		background: var(--color-surface);
	}
	.card.done {
		border-color: transparent;
		background: var(--color-surface-muted);
	}
	li {
		display: flex;
		align-items: center;
		min-height: 52px;
	}
	li + li {
		border-top: 1px solid var(--color-divider);
	}
	.done li {
		min-height: 48px;
	}
	.done li + li {
		border-top-color: var(--color-border);
	}
	.tick {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}
	.box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 2px solid var(--color-subtle);
		border-radius: 7px;
	}
	.box.checked {
		border: 0;
		background: var(--color-accent);
		color: var(--color-surface);
	}
	.name {
		flex: 1;
		min-width: 0;
		padding-right: var(--space-2);
		font-size: 15px;
		overflow-wrap: anywhere;
	}
	.done .name {
		color: var(--color-muted);
		text-decoration: line-through;
	}
	.amount-edit {
		width: 88px;
		height: 36px;
		margin-right: var(--space-2);
		padding: 0 10px;
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-ink);
		font-weight: 600;
	}
	.amount-edit[aria-invalid='true'] {
		border-color: var(--color-danger);
	}
	.row-error {
		min-height: 0;
		padding: 0 var(--space-3) var(--space-2);
		border-top: 0 !important;
		color: var(--color-danger);
		font-size: var(--font-size-secondary);
		justify-content: flex-end;
	}
	.done-amount {
		margin-right: 14px;
		color: var(--color-muted);
		font-size: 13px;
		white-space: nowrap;
	}
</style>
