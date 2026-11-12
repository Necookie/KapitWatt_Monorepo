import type { DashboardAlert } from '@/api/client';

export const hours = (a: DashboardAlert) =>
  Math.round(
    ((new Date(a.windowEnd).getTime() - new Date(a.windowStart).getTime()) / 3_600_000) * 10,
  ) / 10;
