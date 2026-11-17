import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
const js = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const css = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/);
if (!js || !css) throw new Error('Build outputs were not found. Run vite build first.');
const script = await readFile(path.resolve(root, 'dist', js[1]), 'utf8');
const styles = await readFile(path.resolve(root, 'dist', css[1]), 'utf8');
html = html.replace(js[0], '').replace(css[0], () => `<style>${styles}</style>`);
html = html.replace(/^[ \t]+$/gm, '');
html = html.replace('</body>', () => `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script></body>`);
const packages = ['react', 'react-dom', 'scheduler', 'zustand', 'lucide-react', 'clipper-lib'];
const notices = [];
for (const name of packages) {
  const dir = path.join(root, 'node_modules', name);
  const file = (await readdir(dir)).find(f => /^licen[cs]e(?:\.|$)/i.test(f));
  const meta = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  if (!file && name !== 'clipper-lib') throw new Error(`Missing license for ${name}`);
  const text = file ? await readFile(path.join(dir, file), 'utf8') : (await readFile(path.join(dir, 'clipper.js'), 'utf8')).split('(function ()')[0] + '\n' + await readFile(path.join(root, 'licenses/Boost-1.0.txt'), 'utf8') + '\n' + await readFile(path.join(root, 'licenses/JSBN.txt'), 'utf8');
  notices.push(`${name} ${meta.version}\n${text.replace(/[ \t]+$/gm, '')}`);
}
const licensing = notices.join('\n\n────────────────────────────────────\n\n');
html += `\n<!-- Third-party licenses\n${licensing.replace(/--/g, '—')}\n-->\n`;
await mkdir(path.join(root, 'release'), { recursive: true });
await writeFile(path.join(root, 'release/绘本背景工坊.html'), html);
await writeFile(path.join(root, 'release/第三方许可.txt'), licensing);
console.log(`Standalone app: release/绘本背景工坊.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB)`);
