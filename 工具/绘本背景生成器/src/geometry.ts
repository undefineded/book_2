import Clipper from 'clipper-lib';
import { clamp, type Background, type Point, type Shape } from './model';

export function bounds(points: Point[]) {
  const x = Math.min(...points.map(p => p.x)), y = Math.min(...points.map(p => p.y));
  const right = Math.max(...points.map(p => p.x)), bottom = Math.max(...points.map(p => p.y));
  return { x, y, width: right - x, height: bottom - y };
}
export function area(p: Point[]) {
  return p.reduce((sum, a, i) => { const b = p[(i + 1) % p.length]; return sum + a.x * b.y - b.x * a.y; }, 0) / 2;
}
export function resample(points: Point[], count = 128): Point[] {
  const lengths = points.map((a, i) => { const b = points[(i + 1) % points.length]; return Math.hypot(b.x - a.x, b.y - a.y); });
  const total = lengths.reduce((a, b) => a + b, 0); const result: Point[] = [];
  let edge = 0, passed = 0;
  for (let i = 0; i < count; i++) {
    const distance = total * i / count;
    while (edge < points.length - 1 && passed + lengths[edge] < distance) passed += lengths[edge++];
    const t = lengths[edge] ? (distance - passed) / lengths[edge] : 0;
    const a = points[edge], b = points[(edge + 1) % points.length];
    result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return result;
}
export function contour(shape: Shape, width: number, height: number, seed = 1): Point[] {
  let points: Point[] = [];
  if (shape === 'cut') {
    const c = Math.min(width, height) * .12;
    points = [{ x: c, y: 0 }, { x: width - c, y: 0 }, { x: width, y: c }, { x: width, y: height - c }, { x: width - c, y: height }, { x: c, y: height }, { x: 0, y: height - c }, { x: 0, y: c }];
    // Rounded cut corners, keeping a flat central writing area.
    for (let n = 0; n < 2; n++) points = points.flatMap((a, i) => { const b = points[(i + 1) % points.length]; return [{ x: a.x * .85 + b.x * .15, y: a.y * .85 + b.y * .15 }, { x: a.x * .15 + b.x * .85, y: a.y * .15 + b.y * .85 }]; });
  } else if (shape === 'rounded') {
    const r = Math.min(width, height) * .16;
    for (const [cx, cy, start] of [[width - r, height - r, 0], [r, height - r, Math.PI / 2], [r, r, Math.PI], [width - r, r, Math.PI * 1.5]]) {
      for (let i = 0; i <= 16; i++) { const a = start + i / 16 * Math.PI / 2; points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
    }
  } else if (shape === 'cloud') {
    const base = contour('rounded', width, height, seed), amplitude = Math.min(width, height) * .035;
    points = base.map((p, i) => {
      const before = base[(i - 1 + base.length) % base.length], after = base[(i + 1) % base.length];
      const dx = after.x - before.x, dy = after.y - before.y, length = Math.hypot(dx, dy);
      const bulge = amplitude * (.5 + .5 * Math.cos(i / base.length * Math.PI * 2 * 14));
      return { x: p.x + dy / length * bulge, y: p.y - dx / length * bulge };
    });
  } else {
    const exponent = shape === 'oval' ? 1 : .42;
    const phase = seed % 100 / 100 * Math.PI * 2;
    for (let i = 0; i < 192; i++) {
      const t = i / 192 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      let ripple = 1;
      if (shape === 'wave') ripple += .022 * Math.cos(12 * t + .3);
      if (shape === 'natural') ripple += .025 * Math.sin(7 * t + phase) + .018 * Math.cos(11 * t - phase);
      points.push({ x: width / 2 + width / 2 * Math.sign(c) * Math.pow(Math.abs(c), exponent) * ripple, y: height / 2 + height / 2 * Math.sign(s) * Math.pow(Math.abs(s), exponent) * ripple });
    }
  }
  const b = bounds(points);
  const sampled = resample(points.map(p => ({ x: (p.x - b.x) / b.width * width, y: (p.y - b.y) / b.height * height })));
  const final = bounds(sampled);
  return sampled.map(p => ({ x: (p.x - final.x) / final.width * width, y: (p.y - final.y) / final.height * height }));
}
export function localPoints(object: Background): Point[] {
  return object.kind === 'title' && object.points.length ? object.points.map(p => ({ x: p.x * object.width, y: p.y * object.height })) : contour(object.shape, object.width, object.height, object.seed);
}
export function inside(point: Point, polygon: Point[]) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function simplePolygon(p: Point[]) {
  for (let i = 0; i < p.length; i++) for (let j = i + 2; j < p.length; j++) {
    if (i === 0 && j === p.length - 1) continue;
    const a = p[i], b = p[(i + 1) % p.length], c = p[j], d = p[(j + 1) % p.length];
    if (cross(a, b, c) * cross(a, b, d) < -1e-7 && cross(c, d, a) * cross(c, d, b) < -1e-7) return false;
  }
  return true;
}

export function insetContour(points: Point[], requested: number): { points: Point[]; distance: number } {
  const precision = 100, b = bounds(points);
  const path = points.map(p => ({ X: Math.round(p.x * precision), Y: Math.round(p.y * precision) }));
  if (!Clipper.Clipper.Orientation(path)) path.reverse();
  let distance = Math.min(requested, Math.min(b.width, b.height) * .19);
  for (let attempt = 0; attempt < 12; attempt++) {
    const offset = new Clipper.ClipperOffset(2, .2 * precision), paths: any[] = [];
    offset.AddPath(path, Clipper.JoinType.jtRound, Clipper.EndType.etClosedPolygon);
    offset.Execute(paths, -distance * precision);
    if (paths.length === 1 && paths[0].length > 3) {
      const result = paths[0].map((p: { X: number; Y: number }) => ({ x: p.X / precision, y: p.Y / precision }));
      if (Math.abs(area(result)) > Math.abs(area(points)) * .22) return { points: result, distance };
    }
    distance *= .75;
  }
  return { points, distance: 0 };
}

export function deform(object: Background, center: Point, delta: Point, radius: number, strength: number, restore = false): Background {
  if (object.kind !== 'title' || object.locked) return object;
  const current = localPoints(object), original = contour(object.shape, object.width, object.height, object.seed);
  const length = Math.hypot(delta.x, delta.y), limit = radius * .23;
  const dx = delta.x * Math.min(1, limit / (length || 1)), dy = delta.y * Math.min(1, limit / (length || 1));
  const candidate = current.map((p, i) => {
    const t = clamp(1 - Math.hypot(p.x - center.x, p.y - center.y) / radius, 0, 1);
    const weight = t * t * (3 - 2 * t) * strength;
    return restore ? { x: p.x + (original[i].x - p.x) * weight * .35, y: p.y + (original[i].y - p.y) * weight * .35 } : { x: p.x + dx * weight, y: p.y + dy * weight };
  });
  const b = bounds(candidate);
  if (!simplePolygon(candidate) || b.width < 90 || b.height < 80 || b.width > 4096 || b.height > 4096 || Math.abs(area(candidate)) < b.width * b.height * .25) return object;
  return { ...object, x: object.x + b.x, y: object.y + b.y, width: b.width, height: b.height, points: candidate.map(p => ({ x: clamp((p.x - b.x) / b.width, 0, 1), y: clamp((p.y - b.y) / b.height, 0, 1) })) };
}

export function resizeObject(object: Background, axis: 'width' | 'height', value: number): Background {
  const minimum = object.kind === 'fact' ? 180 : 90;
  return { ...object, [axis]: clamp(value, minimum, 4096) };
}
