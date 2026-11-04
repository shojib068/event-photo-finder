import pino from 'pino';
import { getConfig } from '@/core/config';

/** Keys that must never reach logs (selfies, embeddings, tokens, Drive IDs, bodies). */
export const REDACT_PATHS = [
  'selfie', 'image', 'embedding', 'token', 'body', 'req.body',
  'drive_folder_id', 'drive_file_id', 'driveFolderId', 'driveFileId',
  '*.selfie', '*.image', '*.embedding', '*.token', '*.body',
  '*.drive_folder_id', '*.drive_file_id', '*.driveFolderId', '*.driveFileId',
];

let instance: pino.Logger | undefined;

export function getLogger(): pino.Logger {
  instance ??= pino({
    level: getConfig().LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[redacted]' },
  });
  return instance;
}
