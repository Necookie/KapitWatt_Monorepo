import { createContext, useContext } from 'react';

/**
 * The page's content width as the app shell expects it (window, less the sidebar, gutters and the
 * max width). Width-driven layout starts from it so the first render already has the right
 * breakpoint, instead of starting stacked at width 0 and jumping once measured. A ref, not a value:
 * reading it never re-renders, so a resize or a sidebar toggle does not re-render every consumer.
 */
export const ContentWidth = createContext<{ readonly current: number }>({ current: 0 });

export const useContentWidth = () => useContext(ContentWidth);
