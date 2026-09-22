import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
async function list(dir, prefix = '') {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const relative = `${prefix}${item.name}`;
    if (item.isDirectory()) files.push(...await list(join(dir, item.name), `${relative}/`));
    else files.push(relative);
  }
  return files;
}
const files = await list(fileURLToPath(root));
const shell = files.filter(file => file === 'index.html' || file === 'manifest.webmanifest' || file.startsWith('assets/') || file.startsWith('icons/'));
const index = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
if (!index.includes('/assets/')) throw new Error('Vite assets missing from build');
const scriptName = shell.find(file => file.startsWith('assets/') && file.endsWith('.js'));
const styleName = shell.find(file => file.startsWith('assets/') && file.endsWith('.css'));
if (!scriptName || !styleName) throw new Error('Vite entry files missing from build');
const script = (await readFile(new URL(`../dist/${scriptName}`, import.meta.url), 'utf8')).replace(/<\/script/gi, '<\\/script');
const style = (await readFile(new URL(`../dist/${styleName}`, import.meta.url), 'utf8')).replace(/<\/style/gi, '<\\/style');
const offline = index
  .replace(/<script type="module"[^>]*><\/script>/, () => `<script type="module">${script}</script>`)
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${style}</style>`);
await writeFile(new URL('../dist/offline.html', import.meta.url), offline);
const version = String(Date.now());
const sw = `const SHELL = 'geotrainer-shell-${version}';
const MEDIA = 'geotrainer-media-v1';
const PRECACHE = ${JSON.stringify([...shell.map(file => `/${file}`), '/offline.html'])};
self.addEventListener('install', event => { event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('geotrainer-shell-') && key !== SHELL).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (url.pathname.startsWith('/media/')) {
    event.respondWith(caches.open(MEDIA).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }));
    return;
  }
  event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
`;
await writeFile(new URL('../dist/sw.js', import.meta.url), sw);
