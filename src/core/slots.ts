import * as fs from 'fs';
import * as path from 'path';
import { CtxManifest, ContextSlot } from '../types';

const CTX_DIR = '.ctx';

export function loadSlots(projectRoot: string, manifest: CtxManifest): ContextSlot[] {
  const slots: ContextSlot[] = [];

  for (const slotDef of manifest.slots) {
    const sourcePath = path.join(projectRoot, CTX_DIR, slotDef.path);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    const content = fs.readFileSync(sourcePath, 'utf-8');
    slots.push({
      type: slotDef.type,
      name: slotDef.name,
      sourcePath: path.join(CTX_DIR, slotDef.path),
      content,
    });
  }

  return slots;
}

export function slotKey(slot: ContextSlot): string {
  return `${slot.type}:${slot.name}`;
}
