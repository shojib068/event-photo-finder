/** Identifies the descriptor model. Indexes built with another model must be regenerated. */
export const FACE_MODEL_ID = 'human-3.3.6/faceres';
export const DESCRIPTOR_LENGTH = 1024;
/** Models the app needs; copied to /models at build time. */
export const REQUIRED_MODELS = ['blazeface', 'facemesh', 'faceres'] as const;
/** Faces narrower than this (in detection pixels) are skipped: their descriptors are noise. */
export const MIN_FACE_WIDTH_PX = 40;
