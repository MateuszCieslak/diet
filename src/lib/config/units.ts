/** Units an ingredient can be measured in. Nutrition is per 100 g, per 100 ml or per 1 piece. */
export type Unit = 'g' | 'ml' | 'pcs';

export const units: readonly Unit[] = ['g', 'ml', 'pcs'];
