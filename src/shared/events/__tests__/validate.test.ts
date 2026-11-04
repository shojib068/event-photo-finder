import { describe, expect, it } from 'vitest';
import { extractFolderId, isValidEventId, validateEventsFile } from '..';

const FOLDER = '1AbCdEfGhIjKlMnOpQrStUv';

describe('event ids', () => {
  it('accepts slugs and rejects everything else', () => {
    expect(isValidEventId('wedding-2026')).toBe(true);
    for (const bad of ['', 'ab', 'Wedding', '-x-y', 'a b c', '../etc', 'x'.repeat(65), 42]) expect(isValidEventId(bad)).toBe(false);
  });
});

describe('extractFolderId', () => {
  it('reads bare IDs and folder links', () => {
    expect(extractFolderId(FOLDER)).toBe(FOLDER);
    expect(extractFolderId(`https://drive.google.com/drive/folders/${FOLDER}?usp=sharing`)).toBe(FOLDER);
    expect(extractFolderId(`https://drive.google.com/open?id=${FOLDER}`)).toBe(FOLDER);
    expect(extractFolderId('https://example.com')).toBeNull();
  });
});

describe('validateEventsFile', () => {
  const entry = (id: string, folderId = FOLDER) => ({ id, name: id, folderId, indexPath: `/indexes/${id}.json` });

  it('accepts a valid file and defaults indexPath', () => {
    const { events, errors } = validateEventsFile({ events: [entry('wedding-2026'), { id: 'cu-reunion', name: 'CU', folderId: `${FOLDER}x` }] });
    expect(errors).toEqual([]);
    expect(events[1]?.indexPath).toBe('/indexes/cu-reunion.json');
  });

  it('rejects duplicate ids and reused folders', () => {
    const { errors } = validateEventsFile({ events: [entry('one-a'), entry('one-a', `${FOLDER}y`), entry('two-b')] });
    expect(errors).toContain('duplicate event id "one-a"');
    expect(errors.some((e) => e.includes('reuses a folder'))).toBe(true);
  });

  it('rejects bad ids, names, folders and index paths', () => {
    const { errors } = validateEventsFile({ events: [{ id: 'Bad Id', name: '', folderId: 'x', indexPath: '/other.json' }] });
    expect(errors.length).toBeGreaterThanOrEqual(3);
    expect(validateEventsFile({}).errors).toEqual(['"events" must be an array']);
  });
});
