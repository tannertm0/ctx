import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CtxManifest } from '../types';

const MANIFEST_FILE = 'ctx.yaml';

export function findProjectRoot(startDir: string = process.cwd()): string | null {
  let dir = startDir;
  while (true) {
    if (fs.existsSync(path.join(dir, MANIFEST_FILE))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadManifest(projectRoot: string): CtxManifest {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`No ${MANIFEST_FILE} found in ${projectRoot}`);
  }
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const parsed = yaml.load(raw) as CtxManifest;
  if (!parsed.project || !parsed.platforms || !parsed.slots) {
    throw new Error(`Invalid ${MANIFEST_FILE}: missing required fields (project, platforms, slots)`);
  }
  return parsed;
}

export function writeManifest(projectRoot: string, manifest: CtxManifest): void {
  const manifestPath = path.join(projectRoot, MANIFEST_FILE);
  const content = yaml.dump(manifest, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(manifestPath, content, 'utf-8');
}
