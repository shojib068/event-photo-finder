/** Admin API DTOs shared by the handlers (photo-indexing, qr-code) and the admin UI (drive-connect). */
import type { EventSummary } from '@/shared/events/types';

/** One row on the admin page (GET /api/admin/:secret/events). */
export interface AdminEventRow extends EventSummary {
  /** App URL of the QR PNG, present only when status is ready. */
  qrUrl?: string;
  /** Guest URL the QR points to, present only when status is ready. */
  guestUrl?: string;
}

export interface AdminEventsResponse {
  serviceAccountEmail: string | null;
  events: AdminEventRow[];
}

/** Response of PATCH /api/admin/:secret/events/:id. */
export interface SetActiveResponse {
  id: string;
  active: boolean;
}
