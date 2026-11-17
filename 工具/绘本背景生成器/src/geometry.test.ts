import { describe, expect, it } from 'vitest';
import { area, bounds, contour, deform, inside, insetContour, localPoints, resizeObject, simplePolygon } from './geometry';
import { clone, emptyProject, makeBackground, sampleProject, SHAPES, validateProject } from './model';
import { useStudio } from './store';

function distanceToEdges(p: { x: number; y: number }, polygon: { x: number; y: number }[]) {
  return Math.min(...polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length], dx = b.x - a.x, dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }));
}

describe('预设轮廓及等距内缩', () => {
  for (const shape of SHAPES) for (const [w, h] of [[650, 780], [230, 1050], [1200, 190]]) {
    it(`${shape.name} ${w}×${h} 保留单一内缩路径且不穿出纸边`, () => {
      const outer = contour(shape.id, w, h, 163), b = bounds(outer), inner = insetContour(outer, 28);
      expect(simplePolygon(outer)).toBe(true); expect(simplePolygon(inner.points)).toBe(true);
      expect(b.width).toBeCloseTo(w, 0); expect(b.height).toBeCloseTo(h, 0);
      expect(inner.distance).toBeGreaterThan(0);
      expect(Math.abs(area(inner.points))).toBeLessThan(Math.abs(area(outer)));
      expect(inner.points.every(p => inside(p, outer))).toBe(true);
      // Offset rounding and polygon sampling may introduce a subpixel approximation.
      for (const p of inner.points) expect(Math.abs(distanceToEdges(p, outer) - inner.distance)).toBeLessThan(1.8);
    });
  }
  it('过大的内缩距离受到限制，窄纸签仍有内容区域', () => {
    const outer = contour('cloud', 180, 220), result = insetContour(outer, 200);
    expect(result.distance).toBeLessThanOrEqual(180 * .19);
    expect(Math.abs(area(result.points))).toBeGreaterThan(Math.abs(area(outer)) * .22);
  });
});

describe('塑形和单轴约束', () => {
  it('推拉仅作用于画笔邻域，并保持轮廓有效', () => {
    const o = makeBackground('title', emptyProject()), before = localPoints(o);
    const left = before.reduce((a, b) => a.x < b.x ? a : b);
    const next = deform(o, left, { x: -35, y: 4 }, 100, .7);
    expect(next.points.length).toBe(128); expect(simplePolygon(localPoints(next))).toBe(true);
    const oldRight = before.reduce((a, b) => a.x > b.x ? a : b), nextRight = localPoints(next).reduce((a, b) => a.x > b.x ? a : b);
    expect(nextRight.x + next.x).toBeCloseTo(oldRight.x + o.x, 5);
    expect(next.width).toBeGreaterThan(o.width);
  });
  it('快速重复推拉不生成交叉轮廓', () => {
    let o = makeBackground('title', emptyProject());
    for (let i = 0; i < 90; i++) {
      const p = localPoints(o)[i * 13 % 128];
      o = deform(o, p, { x: Math.cos(i) * 130, y: Math.sin(i) * 130 }, 90, .85);
      expect(simplePolygon(localPoints(o))).toBe(true); expect(Math.abs(area(localPoints(o)))).toBeGreaterThan(o.width * o.height * .24);
    }
  });
  it('锁定对象与小百科均不接受液化', () => {
    const title = { ...makeBackground('title', emptyProject()), locked: true }, fact = makeBackground('fact', emptyProject());
    expect(deform(title, { x: 0, y: 0 }, { x: 100, y: 0 }, 100, 1)).toBe(title);
    expect(deform(fact, { x: 0, y: 0 }, { x: 100, y: 0 }, 100, 1)).toBe(fact);
  });
  it('拉宽不改变高度，拉高不改变宽度和装饰参数', () => {
    const o = makeBackground('fact', emptyProject()), wider = resizeObject(o, 'width', 950), taller = resizeObject(wider, 'height', 1100);
    expect(wider.height).toBe(o.height); expect(taller.width).toBe(950);
    expect(taller.leafSize).toBe(o.leafSize); expect(taller.dashWidth).toBe(o.dashWidth);
    expect(taller.leafOffsets).toEqual(o.leafOffsets);
  });
});

describe('项目恢复与撤销', () => {
  it('保存再打开不丢失轮廓和装饰', () => {
    const p = sampleProject(); p.objects[0] = deform(p.objects[0], { x: 20, y: 120 }, { x: -20, y: 0 }, 100, .6);
    p.objects[1].leafOffsets[0].rotation = 27;
    expect(validateProject(JSON.parse(JSON.stringify(p)))).toEqual(p);
  });
  it('拒绝非有限数值、重复编号和损坏的形状数据', () => {
    const p = sampleProject();
    expect(() => validateProject({ ...p, width: NaN })).toThrow();
    expect(() => validateProject({ ...p, objects: [p.objects[0], p.objects[0]] })).toThrow();
    const bad = clone(p); bad.objects[0].points = [{ x: 0, y: 0 }];
    expect(() => validateProject(bad)).toThrow();
  });
  it('整次拖动只有一个撤销步骤，重做恢复最终状态', () => {
    const p = sampleProject(); useStudio.getState().restoreDraft(p);
    const state = useStudio.getState(); state.begin();
    for (let i = 0; i < 10; i++) useStudio.getState().patch(p.objects[0].id, { x: 200 + i * 3 });
    state.end(); expect(useStudio.getState().past).toHaveLength(1);
    const final = clone(useStudio.getState().project);
    state.undo(); expect(useStudio.getState().project).toEqual(p);
    state.redo(); expect(useStudio.getState().project).toEqual(final);
  });
});
