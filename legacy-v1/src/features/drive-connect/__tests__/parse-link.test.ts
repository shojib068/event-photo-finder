import { describe, expect, it } from 'vitest';
import { parseDriveFolderLink } from '../services/parse-link';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

describe('parseDriveFolderLink', () => {
  it.each([
    `https://drive.google.com/drive/folders/${ID}`,
    `https://drive.google.com/drive/folders/${ID}?usp=sharing`,
    `https://drive.google.com/drive/u/0/folders/${ID}`,
    `https://drive.google.com/drive/u/2/folders/${ID}/`,
    `  https://drive.google.com/drive/folders/${ID}  `,
  ])('parses %s', (link) => {
    expect(parseDriveFolderLink(link)).toBe(ID);
  });

  it.each([
    '',
    'not a link',
    `http://drive.google.com/drive/folders/${ID}`,
    `https://evil.com/drive/folders/${ID}`,
    `https://drive.google.com.evil.com/drive/folders/${ID}`,
    `https://drive.google.com/file/d/${ID}/view`,
    'https://drive.google.com/drive/folders/short',
    `https://drive.google.com/drive/folders/${ID}/extra`,
  ])('rejects %s', (link) => {
    expect(parseDriveFolderLink(link)).toBeNull();
  });
});
