/** One entry in config/events.json (developer-only; contains the Drive folder). */
export interface EventConfig {
  id: string;
  name: string;
  /** Drive folder ID, or a full Drive folder link (the ID is extracted). */
  folderId: string;
  indexPath: string;
}

export interface EventsFile {
  events: EventConfig[];
}

/** Public, per-event metadata served at /events/<id>.json. Never contains Drive information. */
export interface PublicEventMeta {
  id: string;
  name: string;
  indexPath: string;
  indexed: boolean;
  photoCount: number;
  faceCount: number;
  indexedAt: string | null;
}
