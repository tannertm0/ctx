import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { findProjectRoot, loadManifest, writeManifest } from '../core/manifest';
import { SlotType } from '../types';

const CTX_DIR = '.ctx';

const VALID_TYPES: SlotType[] = ['agent', 'rules', 'memory', 'docs'];

const TEMPLATES: Record<SlotType, string> = {
  agent: `# Agent: {{name}}

Define your AI agent's persona, capabilities, and instructions here.
`,
  rules: `# Rules: {{name}}

Add coding rules, conventions, and guidelines here.
`,
  memory: `# Memory: {{name}}

Persistent context that should be remembered across sessions.
`,
  docs: `# Docs: {{name}}

Reference documentation for AI context.
`,
};

export function registerAdd(program: Command): void {
  program
    .command('add <type> <name>')
    .description('Add a new context slot (types: agent, rules, memory, docs)')
    .option('-d, --description <desc>', 'Description of the slot')
    .action(async (type: string, name: string, opts) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        console.error('No ctx.yaml found. Run "ctx init" first.');
        process.exit(1);
      }

      if (!VALID_TYPES.includes(type as SlotType)) {
        console.error(`Invalid slot type "${type}". Valid types: ${VALID_TYPES.join(', ')}`);
        process.exit(1);
      }

      const slotType = type as SlotType;
      const relativePath = `${slotType}s/${name}.md`;
      const fullPath = path.join(projectRoot, CTX_DIR, relativePath);

      // Check if slot already exists in manifest
      const manifest = loadManifest(projectRoot);
      const existing = manifest.slots.find((s) => s.type === slotType && s.name === name);
      if (existing) {
        console.error(`Slot "${slotType}:${name}" already exists in ctx.yaml.`);
        process.exit(1);
      }

      // Create the file
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      if (!fs.existsSync(fullPath)) {
        const content = TEMPLATES[slotType].replace(/\{\{name\}\}/g, name);
        fs.writeFileSync(fullPath, content, 'utf-8');
      }

      // Update manifest
      manifest.slots.push({
        type: slotType,
        name,
        path: relativePath,
        description: opts.description,
      });
      writeManifest(projectRoot, manifest);

      console.log(`Added ${slotType}:${name}`);
      console.log(`  File: ${CTX_DIR}/${relativePath}`);
      console.log(`  Manifest updated.`);
      console.log(`\nEdit the file, then run "ctx sync" to push to platforms.`);
    });
}
