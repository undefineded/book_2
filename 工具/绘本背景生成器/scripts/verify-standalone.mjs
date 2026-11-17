// A bundled DOM + native Canvas smoke check, not real-browser verification.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createCanvas, Path2D } from '@napi-rs/canvas';

const file = new URL('../release/绘本背景工坊.html', import.meta.url);
const html = await readFile(file, 'utf8');
assert(!/<(?:script|link)\b[^>]*(?:src|href)=/i.test(html), 'Offline HTML must not request external assets');
const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
const errors = [], downloads = [], urls = new Map(), surfaces = new WeakMap();
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', e => errors.push(e.message));
const dom = new JSDOM(html, {
  url: new URL(file).href, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole,
  beforeParse(window) {
    window.structuredClone = structuredClone; window.Path2D = Path2D; window.Blob = Blob;
    window.ResizeObserver = class { observe() { this.callback([{ contentRect: { width: 1000, height: 780 } }]); } disconnect() {} constructor(callback) { this.callback = callback; } };
    window.HTMLCanvasElement.prototype.setPointerCapture = () => {};
    window.HTMLCanvasElement.prototype.hasPointerCapture = () => false;
    window.HTMLCanvasElement.prototype.releasePointerCapture = () => {};
    function surface(element) {
      let c = surfaces.get(element);
      if (!c) { c = createCanvas(element.width || 1, element.height || 1); surfaces.set(element, c); }
      if (c.width !== element.width) c.width = element.width;
      if (c.height !== element.height) c.height = element.height;
      return c;
    }
    const unwrap = value => value instanceof window.HTMLCanvasElement ? surface(value) : value;
    window.HTMLCanvasElement.prototype.getContext = function (type) {
      if (type !== '2d') return null;
      const context = surface(this).getContext('2d');
      return new Proxy(context, {
        get(target, key) { const value = target[key]; return typeof value === 'function' ? (...args) => value.apply(target, args.map(unwrap)) : value; },
        set(target, key, value) { target[key] = value; return true; },
      });
    };
    window.HTMLCanvasElement.prototype.toBlob = function (callback) { callback(new Blob([surface(this).toBuffer('image/png')], { type: 'image/png' })); };
    window.URL.createObjectURL = blob => { const url = `blob:test-${urls.size}`; urls.set(url, blob); return url; };
    window.URL.revokeObjectURL = () => {};
    window.HTMLAnchorElement.prototype.click = function () { downloads.push({ name: this.download, blob: urls.get(this.href) }); };
    window.fetch = () => { throw new Error('Offline build made an unexpected network request'); };
  },
});
const { window } = dom, doc = window.document;
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(condition, message) {
  for (let i = 0; i < 150; i++) { if (condition()) return; await pause(); }
  throw new Error(message);
}
const button = name => [...doc.querySelectorAll('button')].find(el => el.getAttribute('aria-label') === name || el.textContent.trim() === name);
try {
  vm.runInContext(scripts[0][1], dom.getInternalVMContext(), { filename: fileURLToPath(file) });
  await until(() => button('导出背景'), 'Bundled editor did not start');
  assert(doc.querySelector('canvas[aria-label="背景编辑画布"]'));
  button('保存项目').click();
  await until(() => downloads.length === 1, 'Project JSON was not downloaded');
  const project = JSON.parse(await downloads[0].blob.text());
  assert.equal(project.objects.length, 2); assert.equal(project.width, 1254);
  [...doc.querySelectorAll('button')].find(el => el.textContent.includes('标题背景') && el.textContent.includes('自由推拉')).click();
  await until(() => button('完成形状，调节透明'), 'Adding a title did not switch to shape editing');
  button('完成形状，调节透明').click();
  await until(() => doc.querySelector('input[aria-label="羽化宽度"]'), 'Feather controls were not displayed');
  button('导出背景').click();
  await until(() => doc.querySelector('[role="dialog"]'), 'Export dialog did not open');
  const pngButton = [...doc.querySelectorAll('button')].find(el => el.textContent.includes('下载透明PNG'));
  assert(pngButton && !pngButton.disabled); pngButton.click();
  await until(() => downloads.length === 2, 'PNG was not downloaded');
  assert(downloads[1].name.endsWith('.png'));
  const bytes = Buffer.from(await downloads[1].blob.arrayBuffer());
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert(width > 100 && height > 100); assert.deepEqual(errors, []);
  console.log(`Offline bundle smoke check passed: editor startup, add/finish title, JSON save, real ${width}×${height} PNG export; no external assets or runtime errors. Not a real-browser UI test.`);
} finally { window.close(); }
