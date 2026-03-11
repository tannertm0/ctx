import * as fs from 'fs';
import * as path from 'path';
import { LockFile, LockEntry } from '../types';

const LOCK_FILE = 'ctx.lock';
const LOCK_VERSION = '1';

export function loadLock(projectRoot: string): LockFile {
  const lockPath = path.join(projectRoot, LOCK_FILE);
  if (!fs.existsSync(lockPath)) {
    return { version: LOCK_VERSION, entries: {} };
  }
  const raw = fs.readFileSync(lockPath, 'utf-8');
  return JSON.parse(raw) as LockFile;
}

export function writeLock(projectRoot: string, lock: LockFile): void {
  const lockPath = path.join(projectRoot, LOCK_FILE);
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf-8');
}

export function updateLockEntry(
  lock: LockFile,
  slotKey: string,
  entry: LockEntry
): LockFile {
  return {
    ...lock,
    entries: {
      ...lock.entries,
      [slotKey]: entry,
    },
  };
}
