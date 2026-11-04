import { readFileSync } from 'node:fs';
import type { Readable } from 'node:stream';
import { google, type drive_v3 } from 'googleapis';
import { getConfig } from '@/core/config';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export class DriveNotConfiguredError extends Error {
  constructor() {
    super('Google Drive service account is not configured (GOOGLE_SERVICE_ACCOUNT_KEY_FILE).');
  }
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  mimeType: string;
}

export interface DriveImageFile {
  id: string;
  name: string;
  mimeType: string;
  width: number | null;
  height: number | null;
}

let drive: drive_v3.Drive | undefined;

function keyFile(): string {
  const file = getConfig().GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  if (!file) throw new DriveNotConfiguredError();
  return file;
}

function getDrive(): drive_v3.Drive {
  drive ??= google.drive({ version: 'v3', auth: new google.auth.GoogleAuth({ keyFile: keyFile(), scopes: SCOPES }) });
  return drive;
}

/** The service account email the admin shares folders with, or null when not configured. */
export function getServiceAccountEmail(): string | null {
  try {
    const json = JSON.parse(readFileSync(keyFile(), 'utf8')) as { client_email?: string };
    return json.client_email ?? null;
  } catch {
    return null;
  }
}

export function isFolderMime(mimeType: string): boolean {
  return mimeType === FOLDER_MIME;
}

/** Returns folder metadata. Throws the googleapis error (with `.code` 403/404) when not accessible. */
export async function getDriveFile(fileId: string): Promise<DriveFolderInfo> {
  const res = await getDrive().files.get({ fileId, fields: 'id,name,mimeType', supportsAllDrives: true });
  return { id: res.data.id ?? fileId, name: res.data.name ?? '', mimeType: res.data.mimeType ?? '' };
}

async function listChildren(folderId: string, q: string, fields: string): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await getDrive().files.list({
      q: `'${folderId}' in parents and trashed = false and ${q}`,
      fields: `nextPageToken, files(${fields})`,
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    files.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

/** Lists every image in the folder, recursing into subfolders. */
export async function listImagesRecursive(folderId: string): Promise<DriveImageFile[]> {
  const images = await listChildren(folderId, "mimeType contains 'image/'", 'id,name,mimeType,imageMediaMetadata(width,height)');
  const result: DriveImageFile[] = images.map((f) => ({
    id: f.id ?? '',
    name: f.name ?? '',
    mimeType: f.mimeType ?? '',
    width: f.imageMediaMetadata?.width ?? null,
    height: f.imageMediaMetadata?.height ?? null,
  }));
  const subfolders = await listChildren(folderId, `mimeType = '${FOLDER_MIME}'`, 'id');
  for (const sub of subfolders) {
    if (sub.id) result.push(...(await listImagesRecursive(sub.id)));
  }
  return result.filter((f) => f.id);
}

export async function downloadDriveFile(fileId: string): Promise<Buffer> {
  const res = await getDrive().files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'arraybuffer' });
  return Buffer.from(res.data as ArrayBuffer);
}

export async function streamDriveFile(fileId: string): Promise<Readable> {
  const res = await getDrive().files.get({ fileId, alt: 'media', supportsAllDrives: true }, { responseType: 'stream' });
  return res.data as Readable;
}

/** HTTP-ish status of a googleapis error, if any. */
export function driveErrorStatus(err: unknown): number | undefined {
  const e = err as { code?: unknown; status?: unknown };
  const code = typeof e.code === 'number' ? e.code : typeof e.status === 'number' ? e.status : undefined;
  return code;
}
