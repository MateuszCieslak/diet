/** mysql2 returns DECIMAL columns as strings; repositories convert them with these helpers. */
export function toNum(v: string): number {
	return Number(v);
}

export function toNumOrNull(v: string | null): number | null {
	return v === null ? null : Number(v);
}
