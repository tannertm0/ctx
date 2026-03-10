import * as fs from 'fs';
import * as path from 'path';
import { Adapter, ContextSlot, Platform } from '../types';

export abstract class BaseAdapter implements Adapter {
  abstract platform: Platform;
  abstract displayName: string;
  abstract outputDir: string;

  abstract getOutputPath(slot: ContextSlot, projectRoot: string): string;
  abstract formatContent(slot: ContextSlot): string;

  async writeSlot(slot: ContextSlot, projectRoot: string): Promise<string> {
    const outputPath = this.getOutputPath(slot, projectRoot);
    const fullPath = path.join(projectRoot, outputPath);

    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, this.formatContent(slot), 'utf-8');

    return outputPath;
  }

  async clean(projectRoot: string): Promise<void> {
    const outputPath = path.join(projectRoot, this.outputDir);
    if (fs.existsSync(outputPath)) {
      fs.rmSync(outputPath, { recursive: true, force: true });
    }
  }
}
