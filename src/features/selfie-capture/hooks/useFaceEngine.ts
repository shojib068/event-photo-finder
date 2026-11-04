import { useEffect, useState } from 'react';
import { getBrowserFaceEngine, type FaceEngine } from '../../../shared/face-engine';

export type EngineState = { status: 'loading' } | { status: 'ready'; engine: FaceEngine } | { status: 'error' };

/** Starts loading the face models as soon as the selfie screen opens. */
export function useFaceEngine(attempt: number): EngineState {
  const [state, setState] = useState<EngineState>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    getBrowserFaceEngine().then(
      (engine) => active && setState({ status: 'ready', engine }),
      () => active && setState({ status: 'error' }),
    );
    return () => {
      active = false;
    };
  }, [attempt]);
  return state;
}
