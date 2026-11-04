import type { AddFolderErrorCode } from './types';

/** Drive folder IDs are URL-safe base64-ish strings. */
export const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

export const DRIVE_HOSTS = new Set(['drive.google.com']);

export const ADD_FOLDER_HTTP_STATUS: Record<AddFolderErrorCode, number> = {
  INVALID_LINK: 400,
  NOT_A_FOLDER: 400,
  FOLDER_NOT_SHARED: 403,
  ALREADY_ADDED: 409,
  DRIVE_NOT_CONFIGURED: 503,
};

/** Admin page poll interval while links are queued or indexing. */
export const ADMIN_POLL_MS = 3_000;
