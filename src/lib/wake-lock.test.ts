import { keepScreenOn } from './wake-lock';

afterEach(() => {
	vi.unstubAllGlobals();
});

test('requests a lock, re-requests on visible, releases on cleanup', async () => {
	const release = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
	const request = vi.fn<(type: string) => Promise<unknown>>().mockResolvedValue({ release });
	const listeners: Record<string, () => void> = {};
	vi.stubGlobal('navigator', { wakeLock: { request } });
	vi.stubGlobal('document', {
		visibilityState: 'visible',
		addEventListener: (e: string, f: () => void) => (listeners[e] = f),
		removeEventListener: vi.fn<() => void>()
	});
	const stop = keepScreenOn();
	await Promise.resolve();
	expect(request).toHaveBeenCalledWith('screen');
	listeners.visibilitychange();
	await Promise.resolve();
	expect(request).toHaveBeenCalledTimes(2);
	stop();
	await Promise.resolve();
	expect(release).toHaveBeenCalled();
});

test('does nothing without wake lock support', () => {
	vi.stubGlobal('navigator', {});
	vi.stubGlobal('document', {
		visibilityState: 'visible',
		addEventListener: vi.fn<() => void>(),
		removeEventListener: vi.fn<() => void>()
	});
	expect(() => keepScreenOn()()).not.toThrow();
});

test('swallows a rejected request', async () => {
	const request = vi
		.fn<(type: string) => Promise<unknown>>()
		.mockRejectedValue(new Error('NotAllowedError'));
	vi.stubGlobal('navigator', { wakeLock: { request } });
	vi.stubGlobal('document', {
		visibilityState: 'visible',
		addEventListener: vi.fn<() => void>(),
		removeEventListener: vi.fn<() => void>()
	});
	const stop = keepScreenOn();
	await Promise.resolve();
	await Promise.resolve();
	expect(request).toHaveBeenCalledOnce();
	expect(() => stop()).not.toThrow();
});
