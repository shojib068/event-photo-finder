// Public entry of qr-code.
export { buildEventUrl, renderQr } from './services/qr';
export { isEventAvailable } from '@/shared/events';
export { handleGetQr, handleSetActive } from './api/handlers';
export type { QrFormat, SetActiveResponse } from './types';
