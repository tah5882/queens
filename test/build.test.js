import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('browser entrypoint loads CSS as a stylesheet, not a JavaScript import', async () => {
  const [html, main] = await Promise.all([readFile('index.html', 'utf8'), readFile('src/main.js', 'utf8')]);
  assert.match(html, /<link rel="stylesheet" href="\/src\/style\.css"/);
  assert.doesNotMatch(main, /import\s+['"]\.\/style\.css['"]/);
});

test('service worker precaches the browser modules required to boot', async () => {
  const serviceWorker = await readFile('public/sw.js', 'utf8');
  for (const asset of ['/src/main.js', '/src/style.css', '/src/puzzles.js', '/src/queens-interaction.js', '/src/sudoku.js', '/src/sync.js']) {
    assert.ok(serviceWorker.includes(`'${asset}'`), `${asset} should be precached`);
  }
});
