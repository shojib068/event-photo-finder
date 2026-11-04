const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
export const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const THUMB_SIZE = 1200;

export interface DriveFileInfo {
  name: string;
  mimeType: string;
  thumbnailLink?: string;
}

export class DriveError extends Error {
  constructor(readonly status: number) {
    super(`Drive request failed (${status})`);
  }
}

async function driveFetch(url: string, token: string): Promise<Response> {
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new DriveError(response.status);
  return response;
}

export async function getFileInfo(fileId: string, token: string): Promise<DriveFileInfo> {
  const url = `${DRIVE_FILES}/${encodeURIComponent(fileId)}?fields=name,mimeType,thumbnailLink,trashed&supportsAllDrives=true`;
  const info = (await (await driveFetch(url, token)).json()) as DriveFileInfo & { trashed?: boolean };
  if (info.trashed) throw new DriveError(404);
  return info;
}

/** Resized preview from Drive (fetched with credentials, so private folders work). */
export async function fetchThumbnail(info: DriveFileInfo, token: string): Promise<Response | null> {
  if (!info.thumbnailLink) return null;
  const url = info.thumbnailLink.replace(/=s\d+$/, `=s${THUMB_SIZE}`);
  return driveFetch(url, token).catch(() => null);
}

export async function fetchOriginal(fileId: string, token: string): Promise<Response> {
  return driveFetch(`${DRIVE_FILES}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, token);
}
