import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { writeIfChanged } from '../../scripts/research/write-if-changed.mjs';

describe('research file updates', () => {
  it('keeps an unchanged file untouched and preserves its line endings when changed', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'geotrainer-write-'));
    const file = path.join(dir, 'registry.csv');
    try {
      await writeFile(file, 'a,b\r\n1,2\r\n');
      const oldTime = new Date('2020-01-01T00:00:00Z');
      await utimes(file, oldTime, oldTime);
      const original = await readFile(file, 'utf8');
      await writeIfChanged(file, 'a,b\n1,2\n', original);
      expect((await stat(file)).mtimeMs).toBe(oldTime.getTime());
      await writeIfChanged(file, 'a,b\n1,3\n', original);
      expect(await readFile(file, 'utf8')).toBe('a,b\r\n1,3\r\n');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
