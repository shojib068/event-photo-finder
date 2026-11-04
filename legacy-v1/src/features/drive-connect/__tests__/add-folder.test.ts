import { describe, expect, it, vi } from 'vitest';
import type { EventRecord } from '@/shared/events';
import { addDriveFolderWith, type AddFolderDeps } from '../services/add-folder';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
const LINK = `https://drive.google.com/drive/folders/${ID}`;

function makeDeps(overrides: Partial<AddFolderDeps> = {}): AddFolderDeps {
  const events: EventRecord[] = [];
  return {
    getDriveFile: vi.fn(async (id: string) => ({ id, name: 'Ceremony', mimeType: 'application/vnd.google-apps.folder' })),
    isFolderMime: (m) => m === 'application/vnd.google-apps.folder',
    driveErrorStatus: (err) => (err as { code?: number }).code,
    isDriveNotConfigured: () => false,
    findEventByFolderId: async (id) => events.find((e) => e.driveFolderId === id) ?? null,
    insertEvent: async (input) => {
      const event: EventRecord = {
        id: `ev-${events.length}`, ...input, status: 'pending', active: false,
        photosTotal: 0, photosDone: 0, error: null, createdAt: new Date(),
      };
      events.push(event);
      return event;
    },
    newSlug: () => 'slug-slug-slug-slug-sl',
    ...overrides,
  };
}

describe('addDriveFolderWith', () => {
  it('queues a new folder as pending and inactive', async () => {
    const result = await addDriveFolderWith(makeDeps(), LINK);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.event.status).toBe('pending');
      expect(result.event.active).toBe(false);
      expect(result.event.folderName).toBe('Ceremony');
    }
  });

  it('returns ALREADY_ADDED for the same folder twice', async () => {
    const deps = makeDeps();
    await addDriveFolderWith(deps, LINK);
    const second = await addDriveFolderWith(deps, `${LINK}?usp=sharing`);
    expect(second).toMatchObject({ ok: false, code: 'ALREADY_ADDED' });
  });

  it('returns INVALID_LINK for junk', async () => {
    expect(await addDriveFolderWith(makeDeps(), 'hello')).toEqual({ ok: false, code: 'INVALID_LINK' });
  });

  it.each([403, 404])('maps Drive %i to FOLDER_NOT_SHARED', async (code) => {
    const deps = makeDeps({ getDriveFile: async () => Promise.reject(Object.assign(new Error('x'), { code })) });
    expect(await addDriveFolderWith(deps, LINK)).toEqual({ ok: false, code: 'FOLDER_NOT_SHARED' });
  });

  it('returns NOT_A_FOLDER for a file', async () => {
    const deps = makeDeps({ getDriveFile: async (id) => ({ id, name: 'a.jpg', mimeType: 'image/jpeg' }) });
    expect(await addDriveFolderWith(deps, LINK)).toEqual({ ok: false, code: 'NOT_A_FOLDER' });
  });

  it('returns DRIVE_NOT_CONFIGURED without a service account', async () => {
    const deps = makeDeps({ getDriveFile: async () => Promise.reject(new Error('nope')), isDriveNotConfigured: () => true });
    expect(await addDriveFolderWith(deps, LINK)).toEqual({ ok: false, code: 'DRIVE_NOT_CONFIGURED' });
  });
});
