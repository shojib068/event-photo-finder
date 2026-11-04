import { DriveNotConfiguredError, driveErrorStatus, getDriveFile, isFolderMime } from '@/core/storage';
import { findEventByFolderId, insertEvent } from '@/shared/events';
import { randomToken } from '@/shared/tokens';
import { addDriveFolderWith } from './add-folder';

export { parseDriveFolderLink } from './parse-link';

export function addDriveFolder(link: string) {
  return addDriveFolderWith(
    {
      getDriveFile,
      isFolderMime,
      driveErrorStatus,
      isDriveNotConfigured: (err) => err instanceof DriveNotConfiguredError,
      findEventByFolderId,
      insertEvent,
      newSlug: randomToken,
    },
    link,
  );
}

/** Validates the folder is reachable by the service account and is a folder. */
export async function validateDriveFolder(folderId: string): Promise<boolean> {
  try {
    return isFolderMime((await getDriveFile(folderId)).mimeType);
  } catch {
    return false;
  }
}
