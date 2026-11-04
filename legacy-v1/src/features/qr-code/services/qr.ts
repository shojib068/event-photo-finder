import QRCode from 'qrcode';
import { getConfig } from '@/core/config';
import { QR_ERROR_CORRECTION, QR_PNG_WIDTH } from '../constants';
import type { QrFormat } from '../types';

/** Guest URL printed in the QR code. */
export function buildEventUrl(slug: string, baseUrl = getConfig().PUBLIC_BASE_URL): string {
  return `${baseUrl.replace(/\/+$/, '')}/e/${slug}`;
}

export async function renderQr(url: string, format: QrFormat): Promise<Buffer | string> {
  const options = { errorCorrectionLevel: QR_ERROR_CORRECTION, width: QR_PNG_WIDTH, margin: 2 };
  return format === 'svg' ? QRCode.toString(url, { ...options, type: 'svg' }) : QRCode.toBuffer(url, { ...options, type: 'png' });
}
