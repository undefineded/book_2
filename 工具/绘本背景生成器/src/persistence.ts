import type { Preset, Project } from './model';

const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('paper-studio', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('files');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function readLocal<T>(key: string): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files'), req = tx.objectStore('files').get(key);
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close(); tx.onabort = () => { db.close(); reject(tx.error); };
  });
}
export async function writeLocal(key: 'draft' | 'presets', value: Project | Preset[]) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function saveProject(project: Project) {
  download(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${project.name.replace(/[\\/:*?"<>|]/g, '_')}.paper.json`);
}
