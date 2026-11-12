import { Placeholder } from '@/components/Placeholder';

export default function FlaggedScreen() {
  return (
    <Placeholder
      title="Flagged readings"
      priority="P1"
      todo="Photos that failed a rule check, with readings and flags. Approve or reject each one."
    />
  );
}
