import { createListPoller } from './list-poller';

test('poller skips when inactive or mutating, and drops stale responses', async () => {
	let active = true;
	let calls = 0;
	const got: number[] = [];
	let resolve!: (n: number) => void;
	const p = createListPoller({
		intervalMs: 5000,
		isActive: () => active,
		fetchList: () => {
			calls++;
			return new Promise<number>((r) => (resolve = r));
		},
		onData: (d) => got.push(d)
	});
	const pending = p.tick();
	const end = p.beginMutation(); // local change while fetch in flight
	resolve(1);
	await pending;
	expect(got).toEqual([]); // stale response dropped
	await p.tick();
	expect(got).toEqual([]); // skipped while mutating
	end();
	const t = p.tick();
	resolve(2);
	await t;
	expect(got).toEqual([2]);
	active = false;
	const before = calls;
	await p.tick();
	expect(calls).toBe(before);
});

test('a response is dropped when a mutation began and ended while it was in flight', async () => {
	let resolve!: (n: number) => void;
	const got: number[] = [];
	const p = createListPoller({
		intervalMs: 5000,
		isActive: () => true,
		fetchList: () => new Promise<number>((r) => (resolve = r)),
		onData: (d) => got.push(d)
	});
	const pending = p.tick();
	p.beginMutation()();
	resolve(1);
	await pending;
	expect(got).toEqual([]);
});

test('failed fetches are ignored', async () => {
	const onData = vi.fn<(data: unknown) => void>();
	const p = createListPoller({
		intervalMs: 5000,
		isActive: () => true,
		fetchList: () => Promise.reject(new Error('offline')),
		onData
	});
	await p.tick();
	expect(onData).not.toHaveBeenCalled();
});

test('poller start uses the interval', async () => {
	vi.useFakeTimers();
	const fetchList = vi.fn<() => Promise<never[]>>().mockResolvedValue([]);
	const p = createListPoller({
		intervalMs: 5000,
		isActive: () => true,
		fetchList,
		onData: () => {}
	});
	p.start();
	await vi.advanceTimersByTimeAsync(10_000);
	p.stop();
	await vi.advanceTimersByTimeAsync(10_000);
	expect(fetchList).toHaveBeenCalledTimes(2);
	vi.useRealTimers();
});
