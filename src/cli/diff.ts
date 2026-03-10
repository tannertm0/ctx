import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { findProjectRoot, loadManifest } from '../core/manifest';
import { loadLock } from '../core/lock';
import { loadSlots, slotKey } from '../core/slots';
import { contentHash } from '../core/hash';
import { getAllAdapters } from '../adapters';

export function registerDiff(program: Command): void {
  program
    .command('diff')
    .description('Show what would change on the next sync')
    .option('-s, --slot <slot>', 'Show diff for a specific slot only')
    .action(async (opts) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('No ctx.yaml found. Run "ctx init" first.');
        process.exit(1);
      }

      const manifest = loadManifest(projectRoot);
      const lock = loadLock(projectRoot);
      const slots = loadSlots(projectRoot, manifest);
      const adapters = getAllAdapters(manifest.platforms);

      let hasChanges = false;

      for (const slot of slots) {
        const key = slotKey(slot);

        if (opts.slot && key !== opts.slot && slot.name !== opts.slot) {
          continue;
        }

        const hash = contentHash(slot.content);
        const lockEntry = lock.entries[key];

        if (lockEntry && lockEntry.contentHash === hash) {
          continue;
        }

        hasChanges = true;

        if (!lockEntry) {
          console.log(`+ NEW: ${key}`);
          console.log(`  source: ${slot.sourcePath}`);
          for (const adapter of adapters) {
            const outputPath = adapter.getOutputPath(slot, projectRoot);
            console.log(`  -> [${adapter.platform}] ${outputPath}`);
          }
          console.log();
        } else {
          console.log(`~ MODIFIED: ${key}`);
          console.log(`  source: ${slot.sourcePath}`);
          console.log(`  hash: ${lockEntry.contentHash} -> ${hash}`);

          for (const adapter of adapters) {
            const outputPath = adapter.getOutputPath(slot, projectRoot);
            const fullPath = path.join(projectRoot, outputPath);

            if (fs.existsSync(fullPath)) {
              const currentContent = fs.readFileSync(fullPath, 'utf-8');
              const newContent = (adapter as any).formatContent
                ? (adapter as any).formatContent(slot)
                : slot.content;

              // Simple line-level diff
              const currentLines = currentContent.split('\n');
              const newLines = newContent.split('\n');

              console.log(`  -> [${adapter.platform}] ${outputPath}`);

              const maxLines = Math.max(currentLines.length, newLines.length);
              let diffCount = 0;
              for (let i = 0; i < maxLines && diffCount < 10; i++) {
                if (currentLines[i] !== newLines[i]) {
                  if (currentLines[i] !== undefined) {
                    console.log(`    - ${currentLines[i]}`);
                  }
                  if (newLines[i] !== undefined) {
                    console.log(`    + ${newLines[i]}`);
                  }
                  diffCount++;
                }
              }
              if (diffCount >= 10) {
                console.log(`    ... (${maxLines - 10} more lines)`);
              }
            } else {
              console.log(`  -> [${adapter.platform}] ${outputPath} (will be created)`);
            }
          }
          console.log();
        }
      }

      if (!hasChanges) {
        console.log('No changes detected. All slots are in sync.');
      }
    });
}
