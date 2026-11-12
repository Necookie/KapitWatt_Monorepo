/** Layout constants and the column shape shared by the waterfall and its bars. */
export const CHART = 220;
export const GUTTER = 12;

export type Seg = { value: number; color: string };

export type Column = {
  label: string;
  /** Bottom of the bar, in kW. 0 for totals; the lower end for a loss. */
  from: number;
  segs: Seg[];
  /** What the value label says: a total, or a loss with its sign. */
  text: string;
  note?: string;
  /** An assumption: dashed outline over a light wash. */
  projected?: boolean;
  /** Draw a connector from the top of the previous column at this kW. */
  connectAt?: number;
};
