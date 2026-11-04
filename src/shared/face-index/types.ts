/** Face box relative to the photo, each value 0..1: [x, y, width, height]. */
export type NormalizedBox = [number, number, number, number];

export interface IndexedFace {
  box: NormalizedBox;
  score: number;
  /** Descriptor quantised to bytes, base64. Decode with decodeDescriptor(). */
  d: string;
  /** Scale used for quantisation (max value of the original descriptor). */
  s: number;
}

export interface IndexedPhoto {
  /** Short public ID, stable for the life of the photo. */
  id: string;
  /** Encrypted, event-bound reference used by /api/photo. Never a raw Drive ID. */
  ref: string;
  name: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  takenAt: string | null;
  /** Content checksum, used to skip unchanged photos when re-indexing. */
  checksum: string;
  faces: IndexedFace[];
}

export interface FaceIndex {
  version: 1;
  eventId: string;
  eventName: string;
  generatedAt: string;
  model: string;
  descriptorLength: number;
  photos: IndexedPhoto[];
}

export const FACE_INDEX_VERSION = 1;

/** A photo that matched the visitor's selfie, with its best face similarity (0..1). */
export interface PhotoMatch {
  photo: IndexedPhoto;
  score: number;
}
