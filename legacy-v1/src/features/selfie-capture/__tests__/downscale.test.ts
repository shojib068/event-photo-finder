import { describe, expect, it } from 'vitest';
import { fitWithin } from '../services/downscale';

describe('fitWithin', () => {
  it('caps the long edge at 720', () => {
    expect(fitWithin(1920, 1080, 720)).toEqual({ width: 720, height: 405 });
    expect(fitWithin(1080, 1920, 720)).toEqual({ width: 405, height: 720 });
  });
  it('keeps small images unchanged', () => {
    expect(fitWithin(640, 480, 720)).toEqual({ width: 640, height: 480 });
  });
});
