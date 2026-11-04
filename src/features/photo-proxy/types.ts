export interface PhotoProxyEnv {
  /** Full service-account JSON key (Cloudflare secret). */
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  /** Same secret used by the indexer to encrypt photo refs (Cloudflare secret). */
  PHOTO_REF_SECRET: string;
}
