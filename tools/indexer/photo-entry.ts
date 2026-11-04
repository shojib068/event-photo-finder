import { createHash } from 'node:crypto';
import { encodeDescriptor, type IndexedPhoto } from '../../src/shared/face-index';
import type { DetectedFace } from '../../src/shared/face-engine';
import type { DriveImage } from './drive-client';

/** Stable, non-reversible public photo ID (does not reveal the Drive file ID). */
export function publicPhotoId(secret: string, eventId: string, fileId: string): string {
  return 'p_' + createHash('sha256').update(`${secret}:${eventId}:${fileId}`).digest('hex').slice(0, 16);
}

/** Changes whenever the Drive file content changes; used to skip unchanged photos. */
export function checksumOf(image: DriveImage): string {
  return image.md5Checksum ?? `mtime:${image.modifiedTime ?? 'unknown'}`;
}

/** Original orientation-corrected size, from Drive metadata or the detection image as fallback. */
function dimensions(image: DriveImage, fallback: { width: number; height: number }): { width: number; height: number } {
  const meta = image.imageMediaMetadata;
  if (!meta?.width || !meta.height) return fallback;
  const sideways = meta.rotation === 1 || meta.rotation === 3;
  return sideways ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
}

export function buildPhotoEntry(args: { id: string; ref: string; image: DriveImage; faces: DetectedFace[]; detectionSize: { width: number; height: number } }): IndexedPhoto {
  const { width, height } = dimensions(args.image, args.detectionSize);
  return {
    id: args.id,
    ref: args.ref,
    name: args.image.name,
    mimeType: args.image.mimeType,
    width,
    height,
    takenAt: args.image.imageMediaMetadata?.time ?? null,
    checksum: checksumOf(args.image),
    faces: args.faces.map((face) => ({ box: face.box, score: face.score, ...encodeDescriptor(face.descriptor) })),
  };
}
