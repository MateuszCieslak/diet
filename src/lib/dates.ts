// All dates are 'YYYY-MM-DD' strings. Arithmetic runs on UTC midnight values, so DST never
// shifts a day.

const dayMs = 24 * 60 * 60 * 1000;

function toUtc(date: string): Date {
	return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): string {
	return d.toISOString().slice(0, 10);
}

export function isIsoDate(s: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = toUtc(s);
	return !Number.isNaN(d.getTime()) && fromUtc(d) === s;
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
	// en-CA formats dates as YYYY-MM-DD.
	return new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

export function addDays(date: string, days: number): string {
	return fromUtc(new Date(toUtc(date).getTime() + days * dayMs));
}

/** The seven dates of the week containing `date`, Monday first. */
export function weekOf(date: string): string[] {
	// getUTCDay: 0 = Sunday; shift so Monday = 0.
	const offset = (toUtc(date).getUTCDay() + 6) % 7;
	const monday = addDays(date, -offset);
	return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Inclusive range of dates; empty if `from > to`. */
export function dateRange(from: string, to: string): string[] {
	const result: string[] = [];
	for (let d = from; d <= to; d = addDays(d, 1)) result.push(d);
	return result;
}
