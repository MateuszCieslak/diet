import { addDays, dateRange, isIsoDate, todayIn, weekOf } from './dates';

test('weekOf returns Monday..Sunday', () => {
	expect(weekOf('2026-11-18')).toEqual([
		'2026-11-16',
		'2026-11-17',
		'2026-11-18',
		'2026-11-19',
		'2026-11-20',
		'2026-11-21',
		'2026-11-22'
	]);
	expect(weekOf('2026-11-16')[0]).toBe('2026-11-16');
	expect(weekOf('2026-11-22')[0]).toBe('2026-11-16');
});
test('weekOf across DST and year boundaries', () => {
	expect(weekOf('2026-10-25')).toEqual([
		'2026-10-19',
		'2026-10-20',
		'2026-10-21',
		'2026-10-22',
		'2026-10-23',
		'2026-10-24',
		'2026-10-25'
	]);
	expect(weekOf('2026-12-31')).toEqual([
		'2026-12-28',
		'2026-12-29',
		'2026-12-30',
		'2026-12-31',
		'2027-01-01',
		'2027-01-02',
		'2027-01-03'
	]);
});
test('todayIn uses the time zone', () => {
	expect(todayIn('Europe/Warsaw', new Date('2026-11-18T23:30:00Z'))).toBe('2026-11-19');
});
test('addDays, dateRange, isIsoDate', () => {
	expect(addDays('2026-11-18', -28)).toBe('2026-10-21');
	expect(dateRange('2026-11-18', '2026-11-20')).toEqual(['2026-11-18', '2026-11-19', '2026-11-20']);
	expect(dateRange('2026-11-20', '2026-11-18')).toEqual([]);
	expect(isIsoDate('2026-02-30')).toBe(false);
	expect(isIsoDate('2026-11-18')).toBe(true);
});
