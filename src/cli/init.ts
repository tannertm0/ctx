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

const CTX_USAGE_RULES = `# CTX Context Management

This project uses \`ctx\` to manage AI context across platforms (Claude Code, Cursor, Windsurf).

## Important

- **Source of truth**: All AI context lives in the \`.ctx/\` directory
- **Never edit generated files** in \`.claude/\`, \`.cursor/\`, or \`.windsurf/\` directly — they are overwritten on sync
- After modifying files in \`.ctx/\`, run \`ctx sync\` to regenerate platform files

## Commands

| Command | Description |
|---------|-------------|
| \`ctx add <type> <name>\` | Add a new context slot (agent, rules, memory, docs) |
| \`ctx sync\` | Regenerate all platform files from \`.ctx/\` sources |
| \`ctx status\` | Show which slots are synced, modified, or missing |
| \`ctx diff\` | Preview what would change on next sync |

## Workflow

1. Edit or create files in \`.ctx/\` (rules, agents, memory, docs)
2. Run \`ctx sync\` to propagate changes to all platforms
3. Commit \`.ctx/\`, \`ctx.yaml\`, and \`ctx.lock\` to git
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

      // Create ctx-usage rules file (teaches LLMs about ctx)
      const ctxUsagePath = path.join(ctxDir, 'rules', 'ctx-usage.md');
      if (!fs.existsSync(ctxUsagePath)) {
        fs.writeFileSync(ctxUsagePath, CTX_USAGE_RULES, 'utf-8');
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
          {
            type: 'rules',
            name: 'ctx-usage',
            path: 'rules/ctx-usage.md',
            description: 'Teaches LLMs how to use ctx for context management',
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
