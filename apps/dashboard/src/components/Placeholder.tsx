import { Card, PageHeader, Tag, Txt } from './ui';

/** Stand-in for a screen that is routed but not built yet. Delete once nothing uses it. */
export function Placeholder(props: { title: string; priority: 'P0' | 'P1' | 'P2'; todo: string }) {
  return (
    <>
      <PageHeader
        title={props.title}
        actions={<Tag label={`${props.priority}, not built yet`} />}
      />
      <Card>
        <Txt tone="muted">{props.todo}</Txt>
      </Card>
    </>
  );
}
