import { describe, expect, it } from 'vitest';
import library from '../../content/library.json';
import media from '../../content/media.json';
import { librarySchema, mediaSchema, validateReferences } from '../../src/data/schema';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('content validation', () => {
  it('accepts all published entries and their references', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media);
    expect(() => validateReferences(parsed, assets)).not.toThrow();
    expect(parsed.entries.filter(entry => entry.status === 'published')).toHaveLength(12);
    for (const asset of assets) expect(existsSync(join(process.cwd(), 'public', asset.localPath.slice(1))), asset.id).toBe(true);
  });

  it('rejects a missing media reference', () => {
    const parsed = librarySchema.parse(library);
    const assets = mediaSchema.parse(media);
    const broken = { ...parsed, entries: parsed.entries.map((entry, index) => index === 0 ? { ...entry, mediaId: 'missing-media' } : entry) };
    expect(() => validateReferences(broken, assets)).toThrow(/изображение/);
  });
});
