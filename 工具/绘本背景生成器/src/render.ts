import { clamp, type Background, type Point, type Project } from './model';
import { bounds, inside, insetContour, localPoints } from './geometry';

const surfaceCache = new Map<string, HTMLCanvasElement>();
const canvas = (width: number, height: number) => {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(width)); c.height = Math.max(1, Math.ceil(height)); return c;
};
const context = (c: HTMLCanvasElement) => c.getContext('2d', { willReadFrequently: true })!;
export function pathFor(points: Point[]) {
  const p = new Path2D(); if (!points.length) return p;
  p.moveTo(points[0].x, points[0].y); for (const v of points.slice(1)) p.lineTo(v.x, v.y); p.closePath(); return p;
}
function random(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n ^= n + Math.imul(n ^ n >>> 7, 61 | n); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
function colorMix(a: string, b: string, t: number) {
  const read = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);
  return '#' + [1, 3, 5].map(i => Math.round(read(a, i) * (1 - t) + read(b, i) * t).toString(16).padStart(2, '0')).join('');
}
function texture(ctx: CanvasRenderingContext2D, o: Background) {
  if (!o.texture) return;
  const tile = canvas(128, 128), t = context(tile), rng = random(o.seed);
  for (let i = 0; i < 1600; i++) {
    t.fillStyle = i % 3 ? `rgba(127,94,51,${rng() * .09 * o.texture})` : `rgba(255,255,255,${rng() * .55 * o.texture})`;
    t.fillRect(rng() * 128, rng() * 128, .4 + rng() * 1.2, .4 + rng() * 1.2);
  }
  ctx.fillStyle = ctx.createPattern(tile, 'repeat')!; ctx.fillRect(0, 0, o.width, o.height);
}

// Distance-to-boundary alpha mask. Feathering changes alpha, never paints a white matte.
function featherMask(mask: HTMLCanvasElement, pixels: number, softness: number) {
  if (pixels <= 0) return;
  const ctx = context(mask), { width: w, height: h } = mask, image = ctx.getImageData(0, 0, w, h), data = image.data;
  const dist = new Float32Array(w * h), diagonal = Math.SQRT2;
  for (let i = 0; i < dist.length; i++) dist[i] = data[i * 4 + 3] > 127 ? 1e6 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (x) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
    if (y) dist[i] = Math.min(dist[i], dist[i - w] + 1);
    if (x && y) dist[i] = Math.min(dist[i], dist[i - w - 1] + diagonal);
    if (x + 1 < w && y) dist[i] = Math.min(dist[i], dist[i - w + 1] + diagonal);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    if (x + 1 < w) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
    if (y + 1 < h) dist[i] = Math.min(dist[i], dist[i + w] + 1);
    if (x + 1 < w && y + 1 < h) dist[i] = Math.min(dist[i], dist[i + w + 1] + diagonal);
    if (x && y + 1 < h) dist[i] = Math.min(dist[i], dist[i + w - 1] + diagonal);
  }
  for (let i = 0; i < dist.length; i++) {
    const t = clamp(dist[i] / pixels, 0, 1), smooth = t * t * (3 - 2 * t);
    data[i * 4 + 3] = Math.round(data[i * 4 + 3] * ((1 - softness) * t + softness * smooth));
  }
  ctx.putImageData(image, 0, 0);
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, width: number, angle: number, shade: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  const p = new Path2D(`M 0 0 C ${-width} ${-length * .25} ${-width * .72} ${-length * .82} 0 ${-length} C ${width * .82} ${-length * .83} ${width} ${-length * .22} 0 0 Z`);
  const g = ctx.createLinearGradient(-width, -length, width, 0);
  g.addColorStop(0, shade > .5 ? '#9eae55' : '#788f41'); g.addColorStop(.48, '#678642'); g.addColorStop(1, '#486b36');
  ctx.fillStyle = g; ctx.fill(p); ctx.strokeStyle = 'rgba(57,87,42,.3)'; ctx.lineWidth = .65; ctx.stroke(p);
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(-width * .12, -length * .55, 0, -length * .93);
  ctx.strokeStyle = 'rgba(226,227,153,.6)'; ctx.lineWidth = .9; ctx.stroke();
  ctx.restore();
}
export function leafAnchors(o: Background) {
  const names = o.leafPlacement === 'tl-br' ? ['tl', 'br'] : o.leafPlacement === 'tr-bl' ? ['tr', 'bl'] : [o.leafPlacement];
  return names.map((name, i) => {
    const offset = o.leafOffsets[i];
    return { x: (name.endsWith('l') ? 45 : o.width - 45) + offset.x, y: (name.startsWith('t') ? 60 : o.height - 60) + offset.y,
      angle: (name === 'tl' ? .65 : name === 'tr' ? -.65 : name === 'br' ? Math.PI + .65 : Math.PI - .65) + offset.rotation * Math.PI / 180 };
  });
}
function drawLeaves(ctx: CanvasRenderingContext2D, o: Background) {
  for (const anchor of leafAnchors(o)) {
    const effectiveSize = Math.min(o.leafSize, Math.min(o.width, o.height) * .28);
    ctx.save(); ctx.translate(anchor.x, anchor.y); ctx.rotate(anchor.angle); ctx.scale(effectiveSize / 110, effectiveSize / 110);
    ctx.strokeStyle = '#658044'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 35); ctx.quadraticCurveTo(-7, -20, 2, -78); ctx.stroke();
    const round = o.leafStyle === 'round', sprig = o.leafStyle === 'sprig';
    const locations = sprig ? [[0, 15, 42, 14, -.9], [0, 0, 43, 14, .8], [0, -17, 41, 13, -.85], [0, -32, 38, 13, .75], [0, -48, 35, 12, -.8], [0, -64, 33, 12, .1]] : [[0, 20, 62, round ? 31 : 22, -.85], [0, 1, 62, round ? 31 : 22, .85], [0, -20, 55, round ? 28 : 20, -.8], [0, -39, 49, round ? 25 : 18, .8], [0, -57, 44, round ? 24 : 17, .04]];
    for (const [x, y, length, width, angle] of locations) leaf(ctx, x, y, length, width, angle, (x + y) % 2);
    ctx.restore();
  }
}
function headerRect(o: Background) {
  const height = Math.min(o.headerHeight, o.height * .22), y = clamp(o.headerY, o.inset + 10, o.height * .36);
  const points = localPoints(o);
  const spanAt = (sample: number) => {
    const hits: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a.y > sample) !== (b.y > sample)) hits.push(a.x + (b.x - a.x) * (sample - a.y) / (b.y - a.y));
    }
    return hits.length ? Math.min(o.width / 2 - Math.min(...hits), Math.max(...hits) - o.width / 2) * 2 : 0;
  };
  const available = Math.min(...[y + 3, y + height / 2, y + height - 3].map(spanAt)) - 2 * (Math.min(o.inset, o.width * .1) + 8);
  const width = Math.max(25, Math.min(o.width * o.headerWidth, available));
  return { x: (o.width - width) / 2, y, width, height };
}
export function objectPadding(o: Background) {
  const shadow = o.shadow ? o.shadowBlur * 3 + Math.max(Math.abs(o.shadowX), Math.abs(o.shadowY)) : 0;
  const leaves = o.kind === 'fact' && o.phase === 'finished' && o.leaves ? o.leafSize * 1.6 + Math.max(...o.leafOffsets.map(a => Math.max(Math.abs(a.x), Math.abs(a.y)))) : 0;
  return Math.ceil(Math.max(8, shadow, leaves) + 6);
}

export function renderObject(o: Background, scale = 1, interactive = false) {
  const key = JSON.stringify({ ...o, x: 0, y: 0, name: '', locked: false, id: '', scale, interactive });
  const cached = surfaceCache.get(key); if (cached) return cached;
  const pad = objectPadding(o), c = canvas((o.width + 2 * pad) * scale, (o.height + 2 * pad) * scale), ctx = context(c);
  const points = localPoints(o), path = pathFor(points);
  ctx.scale(scale, scale); ctx.translate(pad, pad);
  const paper = canvas(c.width, c.height), p = context(paper); p.scale(scale, scale); p.translate(pad, pad);
  p.save(); p.clip(path);
  const g = p.createRadialGradient(o.width * .49, o.height * .49, 0, o.width / 2, o.height / 2, Math.max(o.width, o.height) * .7);
  g.addColorStop(0, o.color); g.addColorStop(1, colorMix(o.color, '#ffffff', o.gradient));
  p.fillStyle = g; p.fillRect(0, 0, o.width, o.height); texture(p, o); p.restore();
  if (o.kind === 'title' && o.feather > 0) {
    const mask = canvas(c.width, c.height), m = context(mask); m.scale(scale, scale); m.translate(pad, pad); m.fillStyle = '#ffffff'; m.fill(path);
    featherMask(mask, Math.min(o.feather, Math.min(o.width, o.height) * .32) * scale, o.softness);
    p.save(); p.setTransform(1, 0, 0, 1, 0, 0); p.globalCompositeOperation = 'destination-in'; p.drawImage(mask, 0, 0); p.restore();
  }
  if (o.shadow) {
    const shadow = canvas(c.width, c.height), sc = context(shadow);
    sc.drawImage(paper, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = o.shadowColor; sc.fillRect(0, 0, shadow.width, shadow.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.shadowOpacity * o.opacity;
    ctx.filter = `blur(${o.shadowBlur * scale}px)`; ctx.drawImage(shadow, o.shadowX * scale, o.shadowY * scale); ctx.restore();
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.opacity; ctx.drawImage(paper, 0, 0); ctx.restore();
  if (o.kind === 'fact') {
    ctx.globalAlpha = o.opacity;
    if (o.borderWidth) { ctx.strokeStyle = o.borderColor; ctx.lineWidth = o.borderWidth; ctx.stroke(path); }
    if (o.phase === 'finished') {
      if (o.dashed) {
        const inner = insetContour(points, o.inset).points;
        ctx.save(); ctx.strokeStyle = o.dashColor; ctx.lineWidth = o.dashWidth; ctx.lineCap = 'round'; ctx.setLineDash([o.dashLength, o.dashGap]); ctx.stroke(pathFor(inner)); ctx.restore();
      }
      if (o.header) {
        const { x, y, width: w, height: h } = headerRect(o);
        ctx.save(); ctx.clip(path); ctx.fillStyle = o.headerColor;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, h * .47); ctx.fill();
        ctx.strokeStyle = colorMix(o.headerColor, '#a86a25', .22); ctx.lineWidth = 1.3; ctx.stroke(); ctx.restore();
      }
      if (o.leaves) drawLeaves(ctx, o);
    }
    ctx.globalAlpha = 1;
  }
  surfaceCache.set(key, c);
  // Bounded, small cache; large export surfaces never accumulate indefinitely.
  const max = interactive ? 6 : 12;
  let pixels = [...surfaceCache.values()].reduce((sum, value) => sum + value.width * value.height, 0);
  while (surfaceCache.size > 1 && (surfaceCache.size > max || pixels > 16e6)) {
    const oldest = surfaceCache.keys().next().value!; const old = surfaceCache.get(oldest)!;
    pixels -= old.width * old.height; surfaceCache.delete(oldest);
  }
  return c;
}

export function drawProject(ctx: CanvasRenderingContext2D, project: Project, interactive = false, reference?: HTMLImageElement) {
  if (reference && project.reference) {
    ctx.save(); ctx.globalAlpha = project.reference.opacity;
    const s = Math.min(project.width / reference.width, project.height / reference.height);
    ctx.drawImage(reference, (project.width - reference.width * s) / 2, (project.height - reference.height * s) / 2, reference.width * s, reference.height * s); ctx.restore();
  }
  for (const o of project.objects) {
    const resolution = interactive ? Math.min(1, 480 / Math.max(o.width, o.height)) : Math.min(1, 900 / Math.max(o.width, o.height));
    const img = renderObject(o, resolution, interactive), pad = objectPadding(o);
    ctx.drawImage(img, o.x - pad, o.y - pad, img.width / resolution, img.height / resolution);
  }
}
export function safeRect(o: Background) {
  const m = Math.max(o.inset + 22, Math.min(o.width, o.height) * .13);
  const top = o.header && o.phase === 'finished' ? Math.max(m, clamp(o.headerY, o.inset + 10, o.height * .36) + Math.min(o.headerHeight, o.height * .22) + 22) : m;
  const leafReserve = o.leaves && o.phase === 'finished' ? Math.min(o.leafSize * .35, o.width * .12) : 0;
  let candidate = { x: m + leafReserve, y: top, width: Math.max(20, o.width - 2 * (m + leafReserve)), height: Math.max(20, o.height - top - m - leafReserve) };
  const paper = insetContour(localPoints(o), o.kind === 'fact' ? Math.min(o.inset + 8, Math.min(o.width, o.height) * .2) : 10).points;
  for (let attempt = 0; attempt < 24; attempt++) {
    const { x, y, width: w, height: h } = candidate;
    if ([{ x, y }, { x: x + w, y }, { x, y: y + h }, { x: x + w, y: y + h }].every(p => inside(p, paper))) break;
    candidate = { x: x + w * .035, y: y + h * .035, width: w * .93, height: h * .93 };
  }
  if (o.kind !== 'fact' || !o.leaves || o.phase !== 'finished') return candidate;
  let available = [candidate];
  for (const a of leafAnchors(o)) {
    const scale = Math.min(o.leafSize, Math.min(o.width, o.height) * .28) / 110;
    const leafBox = bounds([{ x: -73, y: -105 }, { x: 73, y: -105 }, { x: -73, y: 40 }, { x: 73, y: 40 }].map(p => ({ x: a.x + (p.x * Math.cos(a.angle) - p.y * Math.sin(a.angle)) * scale, y: a.y + (p.x * Math.sin(a.angle) + p.y * Math.cos(a.angle)) * scale })));
    available = available.flatMap(r => {
      const right = r.x + r.width, bottom = r.y + r.height, lr = leafBox.x + leafBox.width + 8, lb = leafBox.y + leafBox.height + 8;
      if (right < leafBox.x || r.x > lr || bottom < leafBox.y || r.y > lb) return [r];
      return [{ ...r, width: leafBox.x - 8 - r.x }, { ...r, x: lr, width: right - lr }, { ...r, height: leafBox.y - 8 - r.y }, { ...r, y: lb, height: bottom - lb }].filter(v => v.width >= 20 && v.height >= 20);
    });
  }
  return available.sort((a, b) => b.width * b.height - a.width * a.height)[0] ?? { ...candidate, width: 0, height: 0 };
}

export function alphaBounds(c: HTMLCanvasElement) {
  const { width, height } = c, bytes = context(c).getImageData(0, 0, width, height).data;
  let left = width, right = -1, top = height, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (bytes[(y * width + x) * 4 + 3] > 0) {
    left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  return right < 0 ? { x: 0, y: 0, width: 1, height: 1 } : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
export type ExportOptions = { mode: 'object' | 'canvas'; margin: number; width?: number };
export function exportMetrics(project: Project, object: Background | undefined, options: ExportOptions) {
  if (options.mode === 'canvas') return { x: 0, y: 0, width: project.width, height: project.height };
  if (!object) throw new Error('请先选择需要导出的背景。');
  const b = alphaBounds(renderObject(object));
  return { x: b.x - options.margin, y: b.y - options.margin, width: b.width + options.margin * 2, height: b.height + options.margin * 2 };
}
export function exportCanvas(project: Project, object: Background | undefined, options: ExportOptions) {
  const b = exportMetrics(project, object, options), outputWidth = Math.round(options.width ?? b.width), scale = outputWidth / b.width;
  const height = Math.max(1, Math.round(b.height * scale));
  if (outputWidth < 32 || outputWidth > 4096 || height > 4096) throw new Error('导出宽度需为32—4096px，高度不能超过4096px，请调整宽度。');
  const out = canvas(outputWidth, height), ctx = context(out);
  if (options.mode === 'object' && object) {
    // Rerender vector geometry at export resolution; do not upscale the preview.
    const img = renderObject(object, scale);
    ctx.drawImage(img, -b.x * scale, -b.y * scale);
  } else {
    ctx.scale(scale, scale);
    for (const o of project.objects) {
      const img = renderObject(o, scale), pad = objectPadding(o);
      ctx.drawImage(img, o.x - pad, o.y - pad, img.width / scale, img.height / scale);
    }
  }
  return out;
}
export function toPNG(c: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => c.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG导出失败，请尝试较小尺寸。')), 'image/png'));
}
