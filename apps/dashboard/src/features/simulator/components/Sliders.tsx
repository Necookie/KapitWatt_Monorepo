import type { ReactNode } from 'react';
import { Grid } from '@/components/Grid';

export function Sliders({ children }: { children: ReactNode[] }) {
  return (
    <Grid min={240} columns={[2, 1]}>
      {children}
    </Grid>
  );
}
