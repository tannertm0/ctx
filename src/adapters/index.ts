import { Adapter, Platform } from '../types';
import { ClaudeCodeAdapter } from './claude-code';
import { CursorAdapter } from './cursor';
import { WindsurfAdapter } from './windsurf';

const adapterMap: Record<Platform, () => Adapter> = {
  'claude-code': () => new ClaudeCodeAdapter(),
  'cursor': () => new CursorAdapter(),
  'windsurf': () => new WindsurfAdapter(),
};

export function getAdapter(platform: Platform): Adapter {
  const factory = adapterMap[platform];
  if (!factory) {
    throw new Error(`Unknown platform: ${platform}. Supported: ${Object.keys(adapterMap).join(', ')}`);
  }
  return factory();
}

export function getAllAdapters(platforms: Platform[]): Adapter[] {
  return platforms.map(getAdapter);
}
