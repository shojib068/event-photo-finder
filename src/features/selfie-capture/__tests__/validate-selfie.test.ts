import { describe, expect, it } from 'vitest';
import type { DetectedFace } from '../../../shared/face-engine';
import { validateSelfie } from '..';

const face = (widthPx: number): DetectedFace => ({ box: [0, 0, 0, 0], widthPx, score: 1, descriptor: [1] });

describe('validateSelfie', () => {
  it('needs a face', () => expect(validateSelfie([], 800)).toEqual({ ok: false, reason: 'no-face' }));
  it('rejects two prominent faces', () => expect(validateSelfie([face(300), face(250)], 800)).toMatchObject({ reason: 'many-faces' }));
  it('ignores small background faces', () => expect(validateSelfie([face(300), face(60)], 800).ok).toBe(true));
  it('rejects a face that is too small', () => expect(validateSelfie([face(80)], 800)).toMatchObject({ reason: 'too-small' }));
});
