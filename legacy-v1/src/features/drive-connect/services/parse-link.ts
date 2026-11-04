import { DRIVE_HOSTS, DRIVE_ID_PATTERN } from '../constants';

/**
 * Extracts the folder ID from links like
 *   https://drive.google.com/drive/folders/<id>?usp=sharing
 *   https://drive.google.com/drive/u/0/folders/<id>
 * Returns null for anything else.
 */
export function parseDriveFolderLink(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !DRIVE_HOSTS.has(url.hostname)) return null;
  const match = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([^/]+)\/?$/);
  const id = match?.[1];
  return id && DRIVE_ID_PATTERN.test(id) ? id : null;
}
