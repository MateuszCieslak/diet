import type { Attachment } from 'svelte/attachments';
import { searchDebounceMs } from '$lib/search';

/** What the paged list endpoints return; `nextCursor` is `null` on the last page. */
export type Page<T> = { items: T[]; nextCursor: string | null };

type Options<T, F> = {
	/** The wanted filter. Read in an effect, so a change in the state it reads loads page one. */
	filter: () => F;
	/** The endpoint URL for a filter, and for the page after `cursor`. */
	url: (filter: F, cursor?: string) => string;
	/** The first page loaded on the server, with the filter it was loaded for. */
	initial?: { filter: F; page: Page<T> };
	/** Called once a new filter's first page is shown, e.g. to keep the page URL in sync. */
	onLoad?: (filter: F) => void;
};

const sameFilter = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A filtered, scroll-loaded list. Filter changes load page one after `searchDebounceMs` (at once
 * when nothing is loaded yet); the next pages load while `sentinel` (attached below the list) is
 * near the screen. Create it while a component initialises: it starts effects.
 */
export class PagedSearch<T, F> {
	items = $state<T[]>([]);
	nextCursor = $state<string | null>(null);
	/** The filter `items` belong to; `null` until the first page arrives. */
	loadedFilter = $state<F | null>(null);
	loadingMore = $state(false);
	failed = $state(false);
	/** Bumped by `retry` to request the first page again. */
	#attempt = $state(0);
	#sentinelVisible = $state(false);
	// Bumped when a new filter's first page is requested, so a stale "load more" is dropped.
	#generation = 0;
	#opts: Options<T, F>;

	constructor(opts: Options<T, F>) {
		this.#opts = opts;
		if (opts.initial) {
			this.items = opts.initial.page.items;
			this.nextCursor = opts.initial.page.nextCursor;
			this.loadedFilter = opts.initial.filter;
		}

		$effect(() => {
			const filter = opts.filter();
			void this.#attempt;
			if (this.loadedFilter && sameFilter(this.loadedFilter, filter)) return;
			const controller = new AbortController();
			const timer = setTimeout(
				async () => {
					const current = ++this.#generation;
					this.loadingMore = false;
					try {
						const page = await this.#fetch(opts.url(filter), controller.signal);
						if (current !== this.#generation) return;
						this.items = page.items;
						this.nextCursor = page.nextCursor;
						this.loadedFilter = filter;
						this.failed = false;
						opts.onLoad?.(filter);
					} catch (e) {
						if (controller.signal.aborted) return;
						console.error(e);
						this.failed = true;
					}
				},
				this.loadedFilter ? searchDebounceMs : 0
			);
			return () => {
				clearTimeout(timer);
				controller.abort();
			};
		});

		// Keeps loading while the end of the list is in view, so a short page never stalls.
		$effect(() => {
			if (this.#sentinelVisible && this.nextCursor && !this.loadingMore && !this.failed) {
				void this.#loadMore();
			}
		});
	}

	/** Attach to an element after the list: the next page loads while it is near the screen. */
	sentinel: Attachment<HTMLElement> = (node) => {
		const observer = new IntersectionObserver(
			(entries) => {
				this.#sentinelVisible = entries.some((e) => e.isIntersecting);
			},
			{ rootMargin: '300px' }
		);
		observer.observe(node);
		return () => observer.disconnect();
	};

	/** Clearing `failed` restarts "load more"; bumping the attempt restarts a failed first page. */
	retry() {
		this.failed = false;
		this.#attempt++;
	}

	async #fetch(url: string, signal?: AbortSignal): Promise<Page<T>> {
		const res = await fetch(url, { signal });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json();
	}

	async #loadMore() {
		if (!this.loadedFilter || !this.nextCursor) return;
		const current = this.#generation;
		this.loadingMore = true;
		try {
			const page = await this.#fetch(this.#opts.url(this.loadedFilter, this.nextCursor));
			if (current !== this.#generation) return;
			this.items = [...this.items, ...page.items];
			this.nextCursor = page.nextCursor;
			this.failed = false;
		} catch (e) {
			if (current !== this.#generation) return;
			console.error(e);
			this.failed = true;
		} finally {
			if (current === this.#generation) this.loadingMore = false;
		}
	}
}
