const FOLDER_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;
const FOLDER_URL_PATTERN = /\/folders\/([A-Za-z0-9_-]{10,})/;
const OPEN_ID_PATTERN = /[?&]id=([A-Za-z0-9_-]{10,})/;

/** Accepts a bare folder ID or a Drive folder link and returns the folder ID, or null. */
export function extractFolderId(input: string): string | null {
  const value = input.trim();
  if (FOLDER_ID_PATTERN.test(value)) return value;
  const match = FOLDER_URL_PATTERN.exec(value) ?? OPEN_ID_PATTERN.exec(value);
  return match?.[1] ?? null;
}
