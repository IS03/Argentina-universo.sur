// Local private files only. Never follow symlinks into tracked/public output, including on overwrite.
import { lstat, realpath, mkdir, readFile, writeFile, rename, rm, chmod } from 'node:fs/promises';
import { resolve, relative, dirname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';

export async function privatePath(path, { createParents = false } = {}) {
  const root = resolve('.artifacts');
  const target = resolve(path);
  if (!target.startsWith(root + sep)) throw Error('PRIVATE_PATH_REQUIRED');
  if (createParents) await mkdir(root, { mode: 0o700 }).catch(e => { if(e.code !== 'EEXIST') throw e; });
  const parts = ['.artifacts', ...relative(root, target).split(sep)];
  let current = process.cwd();
  for (let i = 0; i < parts.length; i++) {
    current = resolve(current, parts[i]);
    let info = await lstat(current).catch(e => { if (e.code !== 'ENOENT') throw e; return null; });
    if (!info && i < parts.length - 1 && createParents) {
      await mkdir(current, { mode: 0o700 });
      info = await lstat(current);
    }
    if (info?.isSymbolicLink() || info && (i < parts.length - 1 ? !info.isDirectory() : !info.isFile())) throw Error('PRIVATE_PATH_INVALID');
    if (!info && i < parts.length - 1) throw Error('PRIVATE_INPUT_MISSING');
  }
  if (await realpath(root) !== root) throw Error('PRIVATE_PATH_INVALID');
  return target;
}

export async function readPrivateJson(path) {
  const target = await privatePath(path);
  // Refuse broadly-readable snapshots rather than silently exposing them during processing.
  if ((await lstat(target)).mode & 0o077) throw Error('PRIVATE_INPUT_MODE_REQUIRED');
  return JSON.parse(await readFile(target, 'utf8'));
}

export async function writePrivateJson(path, value) {
  const target = await privatePath(path, { createParents: true });
  await chmod(dirname(target), 0o700);
  const temp = target + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await rename(temp, target);
  } finally { await rm(temp, { force: true }); }
}
