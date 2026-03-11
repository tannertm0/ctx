import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { findProjectRoot, loadManifest } from '../core/manifest';
import { loadLock } from '../core/lock';
import { loadSlots, slotKey } from '../core/slots';
import { contentHash } from '../core/hash';
import { StatusEntry } from '../types';

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show sync status of all context slots')
    .action(async () => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('No ctx.yaml found. Run "ctx init" first.');
        process.exit(1);
      }

      const manifest = loadManifest(projectRoot);
      const lock = loadLock(projectRoot);
      const slots = loadSlots(projectRoot, manifest);

      if (slots.length === 0) {
        console.log('No context slots found.');
        return;
      }

      const entries: StatusEntry[] = [];

      for (const slot of slots) {
        const key = slotKey(slot);
        const hash = contentHash(slot.content);
        const lockEntry = lock.entries[key];

        let status: StatusEntry['status'];
        const platforms: Record<string, 'synced' | 'stale' | 'missing'> = {};

        if (!lockEntry) {
          status = 'new';
          for (const p of manifest.platforms) {
            platforms[p] = 'missing';
          }
        } else if (lockEntry.contentHash !== hash) {
          status = 'modified';
          for (const p of manifest.platforms) {
            platforms[p] = 'stale';
          }
        } else {
          status = 'synced';
          for (const p of manifest.platforms) {
            const pe = lockEntry.platforms[p];
            if (!pe) {
              platforms[p] = 'missing';
            } else {
              // Check if output file actually exists
              const outputExists = fs.existsSync(path.join(projectRoot, pe.outputPath));
              platforms[p] = outputExists ? 'synced' : 'missing';
            }
          }
        }

        entries.push({ slot: key, sourcePath: slot.sourcePath, status, platforms });
      }

      // Also check for orphaned lock entries
      for (const [key, entry] of Object.entries(lock.entries)) {
        if (!entries.find((e) => e.slot === key)) {
          entries.push({
            slot: key,
            sourcePath: entry.sourcePath,
            status: 'missing',
            platforms: Object.fromEntries(
              Object.keys(entry.platforms).map((p) => [p, 'stale' as const])
            ),
          });
        }
      }

      // Print status
      const statusIcon: Record<string, string> = {
        synced: '✓',
        modified: '~',
        new: '+',
        missing: '!',
      };

      const platformIcon: Record<string, string> = {
        synced: '✓',
        stale: '~',
        missing: '✗',
      };

      console.log('Context slot status:\n');

      for (const entry of entries) {
        const icon = statusIcon[entry.status] || '?';
        console.log(`  ${icon} ${entry.slot} (${entry.status})`);
        console.log(`    source: ${entry.sourcePath}`);
        for (const [platform, pStatus] of Object.entries(entry.platforms)) {
          console.log(`    ${platformIcon[pStatus]} ${platform}: ${pStatus}`);
        }
        console.log();
      }

      const needsSync = entries.some((e) => e.status !== 'synced');
      if (needsSync) {
        console.log('Run "ctx sync" to update platform files.');
      } else {
        console.log('All slots are synced.');
      }
    });
}
