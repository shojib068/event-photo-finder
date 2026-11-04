/**
 * All user-facing text. Edit wording here only.
 * Entries marked PLACEHOLDER are waiting for the final text from the owner (spec open items).
 */
export const messages = {
  appName: 'Wedding Photos',

  guest: {
    // PLACEHOLDER: final Welcome text to be provided.
    welcomeTitle: 'Welcome!',
    welcomeBody: 'Take a quick selfie and we will find the wedding photos you appear in.',
    privacyNote: 'Your selfie is used only to find your photos and is not saved.',
    start: 'Start',

    // PLACEHOLDER: final Not Available text to be provided.
    notAvailableTitle: 'These photos are not available right now.',
    notAvailableBody: 'Please try again later.',

    loading: 'Loading...',
    genericError: 'Something went wrong. Please try again.',
    tryAgain: 'Try again',

    selfieTip: 'Face the camera in good light.',
    capture: 'Capture',
    retake: 'Retake',
    useThisPhoto: 'Use this photo',
    cameraStarting: 'Starting camera...',
    startCamera: 'Start camera',
    cameraPermissionDenied:
      'We need your camera to take a selfie. Allow camera access in your browser settings (tap the icon next to the address bar), then try again.',
    cameraUnsupported: 'The camera cannot be used on this device or browser.',
    cameraNeedsHttps: 'The camera needs a secure (https) link. Please open the link from the QR code again.',

    // Server quality check codes (technical spec 7.4).
    NO_FACE: 'We could not see a face. Please retake your selfie.',
    MULTIPLE_FACES: 'Please make sure only you are in the photo.',
    LOW_QUALITY: 'Move closer and make sure your face is well lit.',
    FACE_SERVICE_DOWN: 'Something went wrong, please try again shortly.',
    TOO_MANY_REQUESTS: 'Too many tries in a short time. Please wait a minute and try again.',

    // Searching. PLACEHOLDER: to be finalised with the other messages.
    searching: 'Looking for your photos...',

    // PLACEHOLDER: final Sorry text to be provided.
    noMatch: 'Sorry, we could not find your photos.',

    galleryTitle: 'We found your photos',
    galleryCount: (n: number) => (n === 1 ? '1 photo' : `${n} photos`),
    galleryEmpty: 'There are no photos in this gallery.',
    galleryNotFound: 'This gallery link does not work. Please check the link and try again.',
    bookmarkTip: 'Bookmark or save this page to come back to your photos later.',
    downloadAll: 'Download all (ZIP)',
    downloadZip: 'Or download all as a ZIP file',
    saveAllToPhotos: 'Save all to Photos',
    preparingPhotos: (done: number, total: number) => `Getting photos... ${done} of ${total}`,
    savePhotosReady: (count: number, batch: number, batches: number) =>
      batches > 1 ? `Save ${count} photos (${batch} of ${batches})` : `Save ${count} photos`,
    saveNextBatch: (batch: number, batches: number) => `Get next photos (${batch} of ${batches})`,
    saveAgain: 'Save all again',
    saveFinished: 'All photos are saved.',
    saveNotSupported: 'This phone cannot save these photos directly. Use the ZIP download below.',
    saveError: 'Some photos could not be loaded. Please try again.',
    download: 'Download',
    share: 'Share',
    linkCopied: 'Link copied',
    shareTitle: 'My wedding photos',
    close: 'Close',
    previous: 'Previous photo',
    next: 'Next photo',
    photoAlt: (i: number, n: number) => `Photo ${i} of ${n}`,
  },

  admin: {
    title: 'Wedding Photos - Admin',
    serviceEmailLabel: 'App email address',
    serviceEmailMissing: 'Not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE in .env.',
    copy: 'Copy',
    copied: 'Copied',
    shareHelp: 'Share each Drive folder with this email before adding its link.',
    linkPlaceholder: 'Paste Google Drive folder link',
    add: 'Add',
    adding: 'Adding...',
    emptyList: 'No Drive links added yet.',
    statusQueued: 'Queued',
    statusIndexing: 'Indexing...',
    statusReady: 'Ready',
    statusFailed: 'Indexing failed',
    progress: (done: number, total: number) => `${done} / ${total} photos`,
    noPhotos: 'No photos found',
    retry: 'Retry',
    loading: 'Loading...',
    downloadQr: 'Download QR',
    active: 'Active',
    saving: 'Saving...',
    saveError: 'Could not save. Try again.',
    loadError: 'Could not load the links. Retrying...',
    qrAlt: (name: string) => `QR code for ${name}`,

    // API error codes (technical spec section 8).
    INVALID_LINK: 'This does not look like a Google Drive folder link.',
    NOT_A_FOLDER: 'This does not look like a Google Drive folder link.',
    FOLDER_NOT_SHARED: 'We cannot open this folder. Share it with the email shown above, then try again.',
    ALREADY_ADDED: 'This folder has already been added.',
    DRIVE_NOT_CONFIGURED: 'Google Drive is not set up yet. Add the service account key to .env and restart.',
    NOT_READY: 'This link can be switched on after indexing finishes.',
    UNKNOWN: 'Something went wrong. Please try again.',
  },
} as const;

export type GuestErrorCode = 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY' | 'FACE_SERVICE_DOWN' | 'TOO_MANY_REQUESTS';
export type AdminErrorCode =
  | 'INVALID_LINK' | 'NOT_A_FOLDER' | 'FOLDER_NOT_SHARED' | 'ALREADY_ADDED' | 'DRIVE_NOT_CONFIGURED' | 'NOT_READY' | 'UNKNOWN';
