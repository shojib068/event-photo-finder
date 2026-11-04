// Public entry of drive-connect.
export { parseDriveFolderLink, addDriveFolder, validateDriveFolder } from './services';
export { getServiceAccountEmail } from '@/core/storage';
export { handleAddEvent } from './api/handlers';
export { useAddDriveLink } from './hooks/use-add-drive-link';
export { useAdminEvents } from './hooks/use-admin-events';
export { useSetActive } from './hooks/use-set-active';
export type { AddFolderErrorCode, AddFolderResult, AddEventResponse } from './types';
export { AdminScreen } from './components/AdminScreen';
export { isAdminSecret as isAdminPath } from '@/shared/admin-secret';
