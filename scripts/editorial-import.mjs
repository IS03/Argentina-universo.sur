// Backwards-compatible API and CLI; all payloads and diagnostics stay private.
export * from './editorial/import-core.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runWorkImport } from './editorial/work-import.mjs';
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    process.exitCode = args.includes('--integral')
      ? await (await import('./editorial/integral-import.mjs')).runIntegralImport(args)
      : await runWorkImport(args);
  }
  catch { console.error('PRIVATE_IMPORT_FAILED: check local input, permissions and CLI arguments. No payload logged.'); process.exitCode = 1; }
}
