import { describe, expect, it } from 'vitest';
import { checkProductionUrl, eventUrl } from '../production-url';

describe('checkProductionUrl', () => {
  it('accepts permanent https domains', () => {
    expect(checkProductionUrl('https://photos.pages.dev/')).toBe('https://photos.pages.dev');
    expect(eventUrl('https://photos.pages.dev', 'wedding-2026')).toBe('https://photos.pages.dev/event/wedding-2026');
  });
  it.each(['http://photos.pages.dev', 'https://localhost:5173', 'https://127.0.0.1', 'https://192.168.1.4', 'https://10.0.0.2', 'https://172.20.1.1', 'https://abc.trycloudflare.com', 'https://x.ngrok-free.app', 'not a url'])('rejects %s', (url) => {
    expect(() => checkProductionUrl(url)).toThrow();
  });
});
