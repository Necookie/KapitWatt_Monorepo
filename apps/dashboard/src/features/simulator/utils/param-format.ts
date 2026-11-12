import { fraction } from '@/utils/format';

export const pct = (v: number) => fraction(v);
export const spread = (v: number) => `±${fraction(v)}`;
