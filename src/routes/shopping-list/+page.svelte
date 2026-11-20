<script lang="ts">
	import * as v from 'valibot';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import CheckIcon from '$lib/components/icons/CheckIcon.svelte';
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte';
	import { units } from '$lib/config/units';
	import { pl } from '$lib/i18n/pl';
	import { createListPoller } from '$lib/list-poller';
	import { formatAmount } from '$lib/nutrition';
	import { formErrors } from '$lib/schemas/common';
	import { itemPatchSchema, manualItemSchema, type ItemPatch } from '$lib/schemas/shopping';
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

	function amountText(item: ShoppingItemView): string {
		if (item.amount === null) return '';
		// Items without a unit are counted like pieces: at most 1 decimal.
		const amount = formatAmount(item.amount, item.unit ?? 'pcs');
		return item.unit ? `${amount} ${pl.units[item.unit]}` : amount;
	}

	function replaceItem(updated: ShoppingItemView) {
		items = items.map((i) => (i.id === updated.id ? updated : i));
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
		if (blank && !item.manual) {
			amountError = pl.errors.required;
			return;
		}
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
		const parsed = v.safeParse(manualItemSchema, {
			name: newName,
			amount: newAmount,
			unit: newUnit
		});
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
			items = [...items, await res.json()];
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
		<label class="name">
			<span class="visually-hidden">{pl.shopping.name}</span>
			<input
				bind:this={nameInput}
				bind:value={newName}
				placeholder={pl.shopping.namePlaceholder}
				maxlength={120}
				autocomplete="off"
				aria-invalid={addErrors.name ? 'true' : undefined}
			/>
		</label>
		<label>
			<span class="visually-hidden">{pl.shopping.amount}</span>
			<input
				class="amount"
				bind:value={newAmount}
				inputmode="decimal"
				placeholder={pl.shopping.amount}
				autocomplete="off"
				aria-invalid={addErrors.amount ? 'true' : undefined}
			/>
		</label>
		<label>
			<span class="visually-hidden">{pl.shopping.unit}</span>
			<select bind:value={newUnit}>
				<option value="">{pl.shopping.noUnit}</option>
				{#each units as unit (unit)}
					<option value={unit}>{pl.units[unit]}</option>
				{/each}
			</select>
		</label>
		<button class="add" type="submit" aria-label={pl.shopping.addLabel} disabled={adding}>
			<PlusIcon size={20} />
		</button>
	</form>
	{#if addErrors.name || addErrors.amount || addErrors.unit}
		<p class="error" role="alert">{addErrors.name ?? addErrors.amount ?? addErrors.unit}</p>
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
						{:else if item.amount !== null}
							<button
								class="pill"
								aria-label={pl.shopping.editAmount(item.name)}
								onclick={() => startEditing(item)}
							>
								{amountText(item)}
							</button>
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
		display: flex;
		gap: 6px;
	}
	.quick-add label.name {
		flex: 1;
		min-width: 0;
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
	.pill,
	.amount-edit {
		min-width: 64px;
		height: 36px;
		margin-right: var(--space-2);
		padding: 0 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-ink);
		font-weight: 600;
		white-space: nowrap;
	}
	.pill {
		/* The pill stays 36px tall in the row; the hit area is padded out to 44px. */
		position: relative;
		font-size: var(--font-size-secondary);
		cursor: pointer;
	}
	.pill::before {
		position: absolute;
		inset: -4px;
		content: '';
	}
	.amount-edit {
		width: 88px;
		border-color: var(--color-accent);
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
