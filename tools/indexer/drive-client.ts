import { JWT } from 'google-auth-library';
import type { ServiceAccount } from '../../src/core/config/node';

const API = 'https://www.googleapis.com/drive/v3/files';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
export const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;
const FILE_FIELDS = 'id,name,mimeType,md5Checksum,modifiedTime,thumbnailLink,imageMediaMetadata(width,height,rotation,time)';

export interface DriveImage {
  id: string;
  name: string;
  mimeType: string;
  md5Checksum?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number; time?: string };
}

interface DriveItem extends DriveImage {
  mimeType: string;
}

/** JPG/JPEG/PNG/WEBP only; everything else (videos, RAW, docs, shortcuts) is ignored. */
export function isSupportedImage(item: { name: string; mimeType: string }): boolean {
  return SUPPORTED_MIME_TYPES.has(item.mimeType) && SUPPORTED_EXTENSIONS.test(item.name);
}

/** Read-only Drive client for the indexer (service account). Never writes to Drive. */
export class DriveClient {
  private readonly auth: JWT;

  constructor(account: ServiceAccount) {
    this.auth = new JWT({ email: account.client_email, key: account.private_key, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
  }

  private async get(url: string): Promise<Response> {
    const { token } = await this.auth.getAccessToken();
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Drive request failed (${response.status}): ${(await response.text()).slice(0, 200)}`);
    return response;
  }

  /** Throws a clear error when the folder does not exist or is not shared with the service account. */
  async assertFolder(folderId: string): Promise<string> {
    const url = `${API}/${folderId}?fields=id,name,mimeType&supportsAllDrives=true`;
    const item = (await this.get(url).catch(() => {
      throw new Error(`Cannot open Drive folder ${folderId}. Share it (Viewer) with ${this.auth.email}.`);
    }).then((r) => r.json())) as DriveItem;
    if (item.mimeType !== FOLDER_MIME) throw new Error(`${folderId} is not a folder`);
    return item.name;
  }

  /** Lists supported images in the folder and its subfolders, following pagination. */
  async listImages(folderId: string): Promise<DriveImage[]> {
    const images: DriveImage[] = [];
    const queue = [folderId];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (seen.has(current)) continue;
      seen.add(current);
      for await (const item of this.listChildren(current)) {
        if (item.mimeType === FOLDER_MIME) queue.push(item.id);
        else if (isSupportedImage(item)) images.push(item);
      }
    }
    return images.sort((a, b) => a.name.localeCompare(b.name));
  }

  private async *listChildren(folderId: string): AsyncGenerator<DriveItem> {
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: `nextPageToken,files(${FILE_FIELDS})`,
        pageSize: '1000',
        supportsAllDrives: 'true',
        includeItemsFromAllDrives: 'true',
      });
      if (pageToken) params.set('pageToken', pageToken);
      const page = (await (await this.get(`${API}?${params.toString()}`)).json()) as { files?: DriveItem[]; nextPageToken?: string };
      yield* page.files ?? [];
      pageToken = page.nextPageToken;
    } while (pageToken);
  }

  /** Downloads a resized copy for face detection (Drive thumbnail), falling back to the original. */
  async downloadForDetection(image: DriveImage, size: number): Promise<Buffer> {
    if (image.thumbnailLink) {
      const url = image.thumbnailLink.replace(/=s\d+$/, `=s${size}`);
      const thumb = await this.get(url).catch(() => null);
      if (thumb) return Buffer.from(await thumb.arrayBuffer());
    }
    const original = await this.get(`${API}/${image.id}?alt=media&supportsAllDrives=true`);
    return Buffer.from(await original.arrayBuffer());
  }
}
