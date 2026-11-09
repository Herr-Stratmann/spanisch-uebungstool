// Stellt sicher, dass der Service Worker alle App-Dateien kennt (sonst fehlen sie offline).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname;

async function dateien(ordner, endung) {
  const eintraege = await readdir(join(WURZEL, ordner), { withFileTypes: true, recursive: true });
  return eintraege
    .filter((e) => e.isFile() && e.name.endsWith(endung))
    .map((e) => relative(WURZEL, join(e.parentPath ?? e.path, e.name)));
}

test('sw.js enthält alle JS- und Datendateien', async () => {
  const sw = await readFile(join(WURZEL, 'sw.js'), 'utf8');
  const fehlend = [...await dateien('js', '.js'), ...await dateien('data', '.json')]
    .filter((d) => !sw.includes(`'${d}'`));
  assert.deepEqual(fehlend, [], `In sw.js (DATEIEN) fehlen: ${fehlend.join(', ')}`);
});
