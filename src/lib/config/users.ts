/**
 * People using the app. `key` is stored in the database (plan exclusions), so keep it stable.
 * `multiplier` scales recipe amounts and nutrition per person. `color` marks the person in the UI;
 * `tint` is the background of their amount cells. Code must never assume there are exactly two.
 */
export type User = { key: string; name: string; multiplier: number; color: string; tint: string };

export const users: readonly User[] = [
	{ key: 'user1', name: 'Ewelina', multiplier: 1.0, color: '#2457A6', tint: '#F3F6FB' },
	{ key: 'user2', name: 'Mati', multiplier: 1.5, color: '#B0531A', tint: '#FBF4EF' }
];
