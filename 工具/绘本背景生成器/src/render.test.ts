import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createCanvas, Path2D } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyProject, makeBackground, sampleProject, SHAPES } from './model';
import { alphaBounds, exportCanvas, exportMetrics, leafAnchors, objectPadding, renderObject } from './render';

beforeAll(() => {
  vi.stubGlobal('Path2D', Path2D);
  vi.stubGlobal('document', { createElement: (tag: string) => {
    if (tag !== 'canvas') throw new Error(`Unsupported test element ${tag}`);
    return createCanvas(1, 1);
  } });
});
afterAll(() => vi.unstubAllGlobals());

const pixel = (c: HTMLCanvasElement, x: number, y: number) => c.getContext('2d')!.getImageData(Math.round(x), Math.round(y), 1, 1).data;
const alpha = (c: HTMLCanvasElement, x: number, y: number) => pixel(c, x, y)[3];
const png = (c: HTMLCanvasElement): Buffer => (c as unknown as { toBuffer(type: string): Buffer }).toBuffer('image/png');

describe('实际Canvas透明素材渲染', () => {
  it('羽化从外缘透明平滑过渡到内部实色，中心不被整体模糊', () => {
    const o = makeBackground('title', emptyProject()); Object.assign(o, { shape: 'rounded', width: 600, height: 300, feather: 40, shadow: false });
    const c = renderObject(o), pad = objectPadding(o), y = pad + 150;
    expect(alpha(c, 0, 0)).toBe(0); expect(alpha(c, pad - 2, y)).toBe(0);
    expect(alpha(c, pad + 4, y)).toBeLessThan(alpha(c, pad + 15, y));
    expect(alpha(c, pad + 15, y)).toBeLessThan(alpha(c, pad + 30, y));
    expect(alpha(c, pad + 70, y)).toBe(255);
    const colors = pixel(c, pad + 300, y); expect(colors[0]).toBeGreaterThan(240); expect(colors[3]).toBe(255);
  });
  it('开启阴影后仍保留平滑羽化，效果外部完全透明', () => {
    const o = makeBackground('title', emptyProject()); Object.assign(o, { shape: 'rounded', width: 600, height: 300, feather: 40, shadow: true });
    const c = renderObject(o), pad = objectPadding(o), y = pad + 150;
    expect(alpha(c, 0, 0)).toBe(0); expect(alpha(c, pad + 4, y)).toBeLessThan(50);
    const deltas = Array.from({ length: 30 }, (_, x) => Math.abs(alpha(c, pad + x, y) - alpha(c, pad + x + 1, y)));
    expect(Math.max(...deltas)).toBeLessThan(20);
  });
  for (const shape of SHAPES) it(`${shape.name}导出包含叶片和阴影，保留24px透明余量`, () => {
    const project = emptyProject(), o = makeBackground('fact', project); Object.assign(o, { phase: 'finished', shape: shape.id }); project.objects = [o];
    const out = exportCanvas(project, o, { mode: 'object', margin: 24 }), b = alphaBounds(out);
    expect(b.x).toBe(24); expect(b.y).toBe(24);
    expect(out.width - b.x - b.width).toBe(24); expect(out.height - b.y - b.height).toBe(24);
    expect(alpha(out, 0, 0)).toBe(0); expect(alpha(out, out.width - 1, out.height - 1)).toBe(0);
    expect(b.height).toBeGreaterThan(o.height); // Decoration or shadow extends beyond paper itself.
  });
  it('指定输出宽度后按比例重新绘制，尺寸与面板一致', () => {
    const project = sampleProject(), o = project.objects[1], metrics = exportMetrics(project, o, { mode: 'object', margin: 24 });
    const out = exportCanvas(project, o, { mode: 'object', margin: 24, width: 1600 });
    expect(out.width).toBe(1600); expect(out.height).toBe(Math.round(1600 * metrics.height / metrics.width));
    expect(alpha(out, 0, 0)).toBe(0);
  });
  it('参考底图不进入整页PNG，重复导出完全一致', () => {
    const p = sampleProject(), clean = exportCanvas(p, undefined, { mode: 'canvas', margin: 0 });
    p.reference = { src: 'data:image/png;base64,test', name: '参考底图', opacity: 1 };
    const withReference = exportCanvas(p, undefined, { mode: 'canvas', margin: 0 });
    expect(png(clean)).toEqual(png(withReference)); expect(clean.width).toBe(1254); expect(clean.height).toBe(1254);
  });
  it('拉宽或拉高后叶组只跟随对应锚点移动', () => {
    const o = makeBackground('fact', emptyProject()), before = leafAnchors(o);
    const wider = leafAnchors({ ...o, width: o.width + 250 });
    expect(wider[0]).toEqual(before[0]); expect(wider[1].x - before[1].x).toBe(250); expect(wider[1].y).toBe(before[1].y);
    const taller = leafAnchors({ ...o, height: o.height + 180 });
    expect(taller[0]).toEqual(before[0]); expect(taller[1].y - before[1].y).toBe(180); expect(taller[1].x).toBe(before[1].x);
  });
  it('生成可供目视检查的实际PNG', () => {
    const dir = process.env.PAPER_STUDIO_QA_DIR || join(tmpdir(), 'paper-studio-qa'); mkdirSync(dir, { recursive: true });
    const project = sampleProject();
    for (const o of project.objects) writeFileSync(`${dir}/${o.kind}.png`, png(exportCanvas(project, o, { mode: 'object', margin: 24 })));
    const variants = emptyProject(1800, 1800);
    variants.objects = SHAPES.map((shape, i) => { const o = makeBackground('fact', variants); return { ...o, shape: shape.id, phase: 'finished', width: 480, height: 650, x: 80 + i % 3 * 590, y: 170 + Math.floor(i / 3) * 900, leafSize: 95 }; });
    writeFileSync(`${dir}/presets.png`, png(exportCanvas(variants, undefined, { mode: 'canvas', margin: 0 })));
    expect(png(exportCanvas(project, undefined, { mode: 'canvas', margin: 0 })).subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });
});
