import type { Plugin } from 'vite';
import { handlePhotoRequest } from '../../src/features/photo-proxy';
import { getPhotoProxyEnv, loadDotEnv } from '../../src/core/config/node';

const ROUTE = /^\/api\/photo\/([^/?]+)\/([^/?]+)/;

/** In `npm run dev`, emulates the Cloudflare Pages Function at /api/photo/:eventId/:ref. */
export function photoProxyDevPlugin(): Plugin {
  return {
    name: 'photo-proxy-dev',
    apply: 'serve',
    configureServer(server) {
      loadDotEnv();
      if (!getPhotoProxyEnv()) server.config.logger.warn('[photo-proxy] GOOGLE_SERVICE_ACCOUNT_KEY_FILE / PHOTO_REF_SECRET not set: photos will not load in dev.');
      server.middlewares.use(async (req, res, next) => {
        const match = ROUTE.exec(req.url ?? '');
        if (!match) return next();
        const request = new Request(new URL(req.url ?? '/', 'http://localhost'), { method: req.method });
        const response = await handlePhotoRequest(request, { eventId: decodeURIComponent(match[1]!), ref: decodeURIComponent(match[2]!) }, getPhotoProxyEnv() ?? {});
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}
