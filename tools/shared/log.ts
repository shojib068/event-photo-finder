export const log = (...parts: unknown[]) => console.log('[tools]', ...parts);
export const fail = (error: unknown): never => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
};
