const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function validId(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(value); }
function validDay(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value); }

async function getProgress(request, env) {
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('device');
  const day = url.searchParams.get('day');
  if (!validId(deviceId) || !validDay(day)) return json({ error: 'invalid_request' }, 400);
  if (!env.DB) return json({ storage: 'local', progress: null });

  const row = await env.DB.prepare(
    'SELECT queens, crosses, elapsed, solved, updated_at FROM progress WHERE device_id = ? AND puzzle_day = ?'
  ).bind(deviceId, day).first();
  if (!row) return json({ storage: 'd1', progress: null });
  return json({ storage: 'd1', progress: {
    queens: JSON.parse(row.queens), crosses: JSON.parse(row.crosses), elapsed: row.elapsed,
    solved: Boolean(row.solved), updatedAt: row.updated_at
  }});
}

async function putProgress(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !validId(body.deviceId) || !validDay(body.day)) return json({ error: 'invalid_request' }, 400);
  const queensValid = Array.isArray(body.queens) && body.queens.length === 7 && body.queens.every(value => value === null || Number.isInteger(value) && value >= 0 && value < 7);
  const crossesValid = Array.isArray(body.crosses) && body.crosses.length <= 49 && body.crosses.every(value => /^[0-6]-[0-6]$/.test(value));
  if (!queensValid || !crossesValid || !Number.isInteger(body.elapsed) || body.elapsed < 0 || body.elapsed > 86400) return json({ error: 'invalid_progress' }, 400);
  if (!env.DB) return json({ storage: 'local', saved: false });

  await env.DB.prepare(`INSERT INTO progress (device_id, puzzle_day, queens, crosses, elapsed, solved, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(device_id, puzzle_day) DO UPDATE SET queens=excluded.queens, crosses=excluded.crosses,
    elapsed=MAX(progress.elapsed, excluded.elapsed), solved=MAX(progress.solved, excluded.solved), updated_at=CURRENT_TIMESTAMP`
  ).bind(body.deviceId, body.day, JSON.stringify(body.queens), JSON.stringify(body.crosses), body.elapsed, body.solved ? 1 : 0).run();
  return json({ storage: 'd1', saved: true });
}

export async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/api/health') return json({ ok: true, database: Boolean(env.DB) });
  if (url.pathname === '/api/progress' && request.method === 'GET') return getProgress(request, env);
  if (url.pathname === '/api/progress' && request.method === 'PUT') return putProgress(request, env);
  if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
  return env.ASSETS.fetch(request);
}

export default { fetch: handleRequest };
