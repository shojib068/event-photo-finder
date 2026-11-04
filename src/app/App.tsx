import { EventRoute } from './routes/EventRoute';
import { NotFoundRoute } from './routes/NotFoundRoute';
import { matchRoute } from './match-route';

export function App() {
  const route = matchRoute(window.location.pathname);
  return route.name === 'event' ? <EventRoute eventId={route.eventId} /> : <NotFoundRoute />;
}
