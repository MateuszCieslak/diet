export type ListPoller = {
	start(): void;
	stop(): void;
	tick(): Promise<void>;
	/** Marks a local change as in flight; call the returned function when it settles. */
	beginMutation(): () => void;
};

/**
 * Polls a list every `intervalMs` while `isActive()` holds. Polling pauses while a local mutation
 * is pending, and a response is dropped if a mutation began after its fetch started, so an older
 * server state never overwrites a newer local change. Failed fetches are ignored.
 */
export function createListPoller<T>(opts: {
	intervalMs: number;
	fetchList: () => Promise<T>;
	onData: (data: T) => void;
	isActive: () => boolean;
}): ListPoller {
	let timer: ReturnType<typeof setInterval> | undefined;
	let pending = 0;
	/** Bumped by every mutation; a fetch is stale if it changed while the fetch was in flight. */
	let generation = 0;

	async function tick() {
		if (pending > 0 || !opts.isActive()) return;
		const startedAt = generation;
		let data: T;
		try {
			data = await opts.fetchList();
		} catch {
			return;
		}
		if (generation !== startedAt || pending > 0) return;
		opts.onData(data);
	}

	return {
		start() {
			if (timer === undefined) timer = setInterval(() => void tick(), opts.intervalMs);
		},
		stop() {
			clearInterval(timer);
			timer = undefined;
		},
		tick,
		beginMutation() {
			pending++;
			generation++;
			let ended = false;
			return () => {
				if (ended) return;
				ended = true;
				pending--;
			};
		}
	};
}
