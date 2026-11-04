export type Route = { name: 'event'; eventId: string } | { name: 'not-found' };

/** Only /event/:eventId is a page; everything else is "not found". */
export function matchRoute(pathname: string): Route {
  const match = /^\/event\/([^/]+)\/?$/.exec(pathname);
  return match?.[1] ? { name: 'event', eventId: decodeURIComponent(match[1]) } : { name: 'not-found' };
}
