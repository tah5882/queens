import test from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../worker/index.js';

test('health endpoint works without D1', async () => {
  const response = await handleRequest(new Request('https://example.com/api/health'), {});
  assert.deepEqual(await response.json(), { ok: true, database: false });
});

test('progress falls back to local storage when D1 is absent', async () => {
  const response = await handleRequest(new Request('https://example.com/api/progress?device=abcdefgh&day=2026-08-14'), {});
  assert.deepEqual(await response.json(), { storage: 'local', progress: null });
});

test('invalid progress is rejected before database access', async () => {
  const response = await handleRequest(new Request('https://example.com/api/progress', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId: 'short' })
  }), {});
  assert.equal(response.status, 400);
});
