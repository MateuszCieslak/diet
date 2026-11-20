function release(lock: WakeLockSentinel): void {
	lock.release().catch(() => {});
}

/**
 * Keeps the screen on with the Screen Wake Lock API. The browser drops the lock when the page is
 * hidden, so it is requested again when the page becomes visible. Fails silently where the API is
 * missing or the request is refused. Returns a cleanup that releases the lock.
 */
export function keepScreenOn(): () => void {
	const wakeLock = typeof navigator === 'undefined' ? undefined : navigator.wakeLock;
	if (!wakeLock) return () => {};

	let sentinel: WakeLockSentinel | null = null;
	let stopped = false;

	async function request() {
		if (stopped || document.visibilityState !== 'visible') return;
		try {
			const lock = await wakeLock!.request('screen');
			if (stopped) release(lock);
			else sentinel = lock;
		} catch {
			// Refused (e.g. low battery or not allowed): the screen just follows its usual timeout.
		}
	}

	const onVisibilityChange = () => void request();

	document.addEventListener('visibilitychange', onVisibilityChange);
	void request();

	return () => {
		stopped = true;
		document.removeEventListener('visibilitychange', onVisibilityChange);
		if (sentinel) release(sentinel);
		sentinel = null;
	};
}
