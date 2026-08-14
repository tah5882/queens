const DEVICE_KEY = 'queens-device-id';

export function getDeviceId(storage = localStorage) {
  let id = storage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID().replaceAll('-', '');
    storage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function loadRemoteProgress(day, signal) {
  const device = getDeviceId();
  const response = await fetch(`/api/progress?device=${encodeURIComponent(device)}&day=${encodeURIComponent(day)}`, { signal });
  if (!response.ok) throw new Error(`sync_load_${response.status}`);
  return response.json();
}

export async function saveRemoteProgress(day, progress) {
  const response = await fetch('/api/progress', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId: getDeviceId(), day, ...progress })
  });
  if (!response.ok) throw new Error(`sync_save_${response.status}`);
  return response.json();
}
