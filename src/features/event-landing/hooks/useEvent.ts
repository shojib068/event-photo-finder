import { useCallback, useEffect, useState } from 'react';
import { loadEvent, type LoadEventResult } from '../services/load-event';

export type EventState = { status: 'loading' } | LoadEventResult;

export function useEvent(eventId: string): { state: EventState; reload: () => void } {
  const [state, setState] = useState<EventState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    loadEvent(eventId).then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [eventId, attempt]);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);
  return { state, reload };
}
