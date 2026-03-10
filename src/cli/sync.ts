import { Command } from 'commander';
import { findProjectRoot, loadManifest } from '../core/manifest';
import { loadLock, writeLock, updateLockEntry } from '../core/lock';
import { loadSlots, slotKey } from '../core/slots';
import { contentHash } from '../core/hash';
import { getAllAdapters } from '../adapters';
import { LockEntry, SyncResult } from '../types';

export function registerSync(program: Command): void {
  program
    .command('sync')
    .description('Compile and sync .ctx/ context to all configured platforms')
    .option('--force', 'Force sync all slots even if unchanged')
    .option('--clean', 'Clean platform output directories before syncing')
    .action(async (opts) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('No ctx.yaml found. Run "ctx init" first.');
        process.exit(1);
      }

      const manifest = loadManifest(projectRoot);
      let lock = loadLock(projectRoot);
      const slots = loadSlots(projectRoot, manifest);
      const adapters = getAllAdapters(manifest.platforms);

      if (opts.clean) {
        for (const adapter of adapters) {
          await adapter.clean(projectRoot);
          console.log(`Cleaned ${adapter.displayName} output directory`);
        }
      }

      if (slots.length === 0) {
        console.log('No context slots found. Add files to .ctx/ and update ctx.yaml.');
        return;
      }

      const results: SyncResult[] = [];

      for (const slot of slots) {
        const key = slotKey(slot);
        const hash = contentHash(slot.content);
        const existingEntry = lock.entries[key];
        const isChanged = !existingEntry || existingEntry.contentHash !== hash || opts.force;

        const lockEntry: LockEntry = {
          sourcePath: slot.sourcePath,
          contentHash: hash,
          lastSynced: new Date().toISOString(),
          platforms: {},
        };

        for (const adapter of adapters) {
          if (!isChanged && existingEntry?.platforms[adapter.platform]?.synced) {
            lockEntry.platforms[adapter.platform] = existingEntry.platforms[adapter.platform];
            results.push({
              platform: adapter.platform,
              slot: key,
              outputPath: existingEntry.platforms[adapter.platform].outputPath,
              action: 'unchanged',
            });
            continue;
          }

          const outputPath = await adapter.writeSlot(slot, projectRoot);
          lockEntry.platforms[adapter.platform] = {
            outputPath,
            synced: true,
          };

          results.push({
            platform: adapter.platform,
            slot: key,
            outputPath,
            action: existingEntry ? 'updated' : 'created',
          });
        }

        lock = updateLockEntry(lock, key, lockEntry);
      }

      writeLock(projectRoot, lock);

      // Print summary
      const created = results.filter((r) => r.action === 'created').length;
      const updated = results.filter((r) => r.action === 'updated').length;
      const unchanged = results.filter((r) => r.action === 'unchanged').length;

      console.log(`\nSync complete:`);
      console.log(`  ${created} created, ${updated} updated, ${unchanged} unchanged`);

      for (const result of results.filter((r) => r.action !== 'unchanged')) {
        console.log(`  ${result.action === 'created' ? '+' : '~'} [${result.platform}] ${result.outputPath}`);
      }
    });
}
