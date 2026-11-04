import { NextResponse } from 'next/server';

/** Standard error body: `{ error: { code, message } }`. Messages are generic; detail stays in logs. */
export function jsonError(status: number, code: string, message = code): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const notFound = () => jsonError(404, 'NOT_FOUND', 'Not found');

/** Client IP for rate limiting (tunnel sets x-forwarded-for / cf-connecting-ip). */
export function clientIp(headers: Headers): string {
  return headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

export const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;
