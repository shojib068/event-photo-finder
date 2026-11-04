# src/core
Configuration. `config/index.ts` is the only reader of `import.meta.env` (browser); `config/node.ts` is the only reader of `process.env` (tools, dev proxy).
