import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { writeManifest } from '../core/manifest';
import { CtxManifest, Platform } from '../types';

const CTX_DIR = '.ctx';

const SLOT_DIRS: Record<string, string> = {
  agents: 'agents',
  rules: 'rules',
  memory: 'memory',
  docs: 'docs',
};

const DEFAULT_RULES = `# Coding Rules

Add your team's coding rules and conventions here.
These will be synced to all configured AI platforms.
`;

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize a new .ctx/ context folder and ctx.yaml manifest')
    .option('-p, --platforms <platforms>', 'Comma-separated list of platforms', 'claude-code')
    .option('-n, --name <name>', 'Project name')
    .action(async (opts) => {
      const projectRoot = process.cwd();
      const ctxDir = path.join(projectRoot, CTX_DIR);

      if (fs.existsSync(path.join(projectRoot, 'ctx.yaml'))) {
        console.error('ctx.yaml already exists. Aborting.');
        process.exit(1);
      }

      // Create .ctx/ directory structure
      fs.mkdirSync(ctxDir, { recursive: true });
      for (const dir of Object.values(SLOT_DIRS)) {
        fs.mkdirSync(path.join(ctxDir, dir), { recursive: true });
      }

      // Create default rules file
      const defaultRulesPath = path.join(ctxDir, 'rules', 'default.md');
      if (!fs.existsSync(defaultRulesPath)) {
        fs.writeFileSync(defaultRulesPath, DEFAULT_RULES, 'utf-8');
      }

      // Determine project name
      const projectName = opts.name || path.basename(projectRoot);
      const platforms = (opts.platforms as string).split(',').map((p: string) => p.trim()) as Platform[];

      // Create manifest
      const manifest: CtxManifest = {
        project: projectName,
        version: '1.0',
        platforms,
        slots: [
          {
            type: 'rules',
            name: 'default',
            path: 'rules/default.md',
            description: 'Default coding rules',
          },
        ],
      };

      writeManifest(projectRoot, manifest);

      // Create .gitignore entries for platform output dirs
      const gitignoreEntries = [
        '# Platform output directories (managed by ctx)',
        '.claude/',
        '.cursor/',
        '.windsurf/',
      ];
      const gitignorePath = path.join(projectRoot, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const existing = fs.readFileSync(gitignorePath, 'utf-8');
        const missing = gitignoreEntries.filter((e) => !e.startsWith('#') && !existing.includes(e));
        if (missing.length > 0) {
          fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries.join('\n') + '\n');
        }
      }

      console.log(`Initialized ctx in ${projectRoot}`);
      console.log(`  Created ${CTX_DIR}/ with default structure`);
      console.log(`  Created ctx.yaml for project "${projectName}"`);
      console.log(`  Platforms: ${platforms.join(', ')}`);
      console.log(`\nNext steps:`);
      console.log(`  1. Edit .ctx/rules/default.md with your coding rules`);
      console.log(`  2. Run 'ctx add' to add more context slots`);
      console.log(`  3. Run 'ctx sync' to generate platform files`);
    });
}
