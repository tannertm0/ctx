export type Platform = 'claude-code' | 'cursor' | 'windsurf';

export type SlotType = 'agent' | 'rules' | 'memory' | 'docs';

export interface ContextSlot {
  type: SlotType;
  name: string;
  sourcePath: string;
  content: string;
}

export interface CtxManifest {
  project: string;
  version: string;
  team?: string;
  description?: string;
  platforms: Platform[];
  slots: ManifestSlot[];
}

export interface ManifestSlot {
  type: SlotType;
  name: string;
  path: string;
  description?: string;
}

export interface LockEntry {
  sourcePath: string;
  contentHash: string;
  lastSynced: string;
  platforms: Record<string, {
    outputPath: string;
    synced: boolean;
  }>;
}

export interface LockFile {
  version: string;
  entries: Record<string, LockEntry>;
}

export interface Adapter {
  platform: Platform;
  displayName: string;
  outputDir: string;
  writeSlot(slot: ContextSlot, projectRoot: string): Promise<string>;
  clean(projectRoot: string): Promise<void>;
  getOutputPath(slot: ContextSlot, projectRoot: string): string;
}

export interface SyncResult {
  platform: Platform;
  slot: string;
  outputPath: string;
  action: 'created' | 'updated' | 'unchanged';
}

export interface StatusEntry {
  slot: string;
  sourcePath: string;
  status: 'synced' | 'modified' | 'new' | 'missing';
  platforms: Record<string, 'synced' | 'stale' | 'missing'>;
}
