export type Point = { x: number; y: number };
export type Shape = 'rounded' | 'wave' | 'cloud' | 'natural' | 'oval' | 'cut';
export type Kind = 'title' | 'fact';
export type LeafStyle = 'slim' | 'round' | 'sprig';
export type LeafPlacement = 'tl-br' | 'tr-bl' | 'tl' | 'br';
export type LeafOffset = { x: number; y: number; rotation: number };

export interface Background {
  id: string; name: string; kind: Kind; shape: Shape; phase: 'shape' | 'finished';
  x: number; y: number; width: number; height: number; seed: number; locked: boolean;
  points: Point[];
  color: string; gradient: number; texture: number; opacity: number;
  feather: number; softness: number;
  shadow: boolean; shadowColor: string; shadowBlur: number; shadowOpacity: number; shadowX: number; shadowY: number;
  borderColor: string; borderWidth: number;
  dashed: boolean; dashColor: string; dashWidth: number; dashLength: number; dashGap: number; inset: number;
  leaves: boolean; leafStyle: LeafStyle; leafPlacement: LeafPlacement; leafSize: number;
  leafOffsets: [LeafOffset, LeafOffset];
  header: boolean; headerColor: string; headerWidth: number; headerHeight: number; headerY: number;
}
export interface Project {
  version: 1; name: string; width: number; height: number; objects: Background[];
  reference?: { src: string; name: string; opacity: number };
}
export interface Preset { id: string; name: string; object: Background }
export const SHAPES: { id: Shape; name: string; description: string }[] = [
  { id: 'rounded', name: '圆角纸卡', description: '柔和规整' },
  { id: 'wave', name: '柔波纸签', description: '轻柔波浪' },
  { id: 'cloud', name: '云朵纸签', description: '圆润童趣' },
  { id: 'natural', name: '自然纸片', description: '手作边缘' },
  { id: 'oval', name: '椭圆纸签', description: '简洁柔软' },
  { id: 'cut', name: '切角纸签', description: '轻盈切角' },
];
export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
export const clone = <T,>(value: T): T => structuredClone(value);

export function makeBackground(kind: Kind, project: Pick<Project, 'width' | 'height'>, count = 1): Background {
  const width = Math.min(kind === 'title' ? 800 : 650, project.width * .74);
  const height = Math.max(kind === 'fact' ? 180 : 90, Math.min(kind === 'title' ? 320 : 780, project.height * .68));
  return {
    id: crypto.randomUUID(), name: `${kind === 'title' ? '标题背景' : '小百科背景'}${count}`,
    kind, shape: kind === 'title' ? 'natural' : 'wave', phase: 'shape',
    x: (project.width - width) / 2, y: (project.height - height) / 2,
    width, height, seed: Math.floor(Math.random() * 1e7), locked: false, points: [],
    color: '#fff1d7', gradient: .35, texture: .32, opacity: 1,
    feather: kind === 'title' ? 55 : 0, softness: .65,
    shadow: kind === 'fact', shadowColor: '#6b5438', shadowBlur: 14, shadowOpacity: .16, shadowX: 0, shadowY: 7,
    borderColor: '#d8bd99', borderWidth: 3,
    dashed: true, dashColor: '#de9548', dashWidth: 3, dashLength: 12, dashGap: 11, inset: 28,
    leaves: true, leafStyle: 'slim', leafPlacement: 'tl-br', leafSize: 115,
    leafOffsets: [{ x: 0, y: 0, rotation: 0 }, { x: 0, y: 0, rotation: 0 }],
    header: true, headerColor: '#f4c565', headerWidth: .64, headerHeight: 78, headerY: 58,
  };
}

export function emptyProject(width = 1254, height = 1254): Project {
  return { version: 1, name: '未命名画布', width, height, objects: [] };
}
export function sampleProject(): Project {
  const p = emptyProject(); p.name = '我的绘本背景';
  const title = makeBackground('title', p);
  Object.assign(title, { x: 175, y: 106, width: 895, height: 320, phase: 'finished' });
  const fact = makeBackground('fact', p);
  Object.assign(fact, { x: 343, y: 536, width: 590, height: 615, phase: 'finished', leafSize: 100, headerHeight: 70 });
  p.objects = [title, fact]; return p;
}

// Canonicalize imported data rather than trusting arbitrary JSON properties.
export function validateProject(raw: unknown): Project {
  if (!raw || typeof raw !== 'object') throw new Error('这不是有效的项目文件。');
  const r = raw as Record<string, unknown>;
  if (r.version !== 1 || !Array.isArray(r.objects) || r.objects.length > 30) throw new Error('项目版本不支持，或对象超过30个。');
  const number = (value: unknown, min: number, max: number) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('项目含有无效尺寸或参数。');
    return value;
  };
  const project = emptyProject(number(r.width, 256, 4096), number(r.height, 256, 4096));
  project.name = typeof r.name === 'string' ? r.name.slice(0, 80) : '导入的画布';
  const ids = new Set<string>();
  for (const item of r.objects) {
    if (!item || typeof item !== 'object') throw new Error('背景对象格式不正确。');
    const o = item as Record<string, unknown>;
    if (o.kind !== 'title' && o.kind !== 'fact') throw new Error('背景类型不支持。');
    const target = makeBackground(o.kind, project);
    if (typeof o.id !== 'string' || !o.id || ids.has(o.id)) throw new Error('对象编号重复或缺失。');
    target.id = o.id.slice(0, 128); ids.add(target.id);
    target.name = typeof o.name === 'string' ? o.name.slice(0, 60) : target.name;
    if (!SHAPES.some(s => s.id === o.shape)) throw new Error('纸签形状不支持。');
    target.shape = o.shape as Shape;
    target.phase = o.phase === 'finished' ? 'finished' : 'shape';
    const ranges: Partial<Record<keyof Background, [number, number]>> = {
      x: [-8192, 8192], y: [-8192, 8192], width: [80, 4096], height: [80, 4096], seed: [0, 1e9],
      gradient: [0, 1], texture: [0, 1], opacity: [0, 1], feather: [0, 300], softness: [0, 1],
      shadowBlur: [0, 80], shadowOpacity: [0, 1], shadowX: [-100, 100], shadowY: [-100, 100],
      borderWidth: [0, 12], dashWidth: [1, 12], dashLength: [2, 60], dashGap: [2, 60], inset: [4, 160],
      leafSize: [30, 220], headerWidth: [.25, .85], headerHeight: [20, 180], headerY: [10, 180],
    };
    for (const [key, range] of Object.entries(ranges)) {
      (target as unknown as Record<string, unknown>)[key] = number(o[key], range[0], range[1]);
    }
    for (const key of ['color', 'shadowColor', 'borderColor', 'dashColor', 'headerColor'] as const) {
      if (typeof o[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(o[key] as string)) throw new Error('项目颜色格式不正确。');
      target[key] = o[key] as string;
    }
    for (const key of ['locked', 'shadow', 'dashed', 'leaves', 'header'] as const) {
      if (typeof o[key] !== 'boolean') throw new Error('项目开关格式不正确。');
      target[key] = o[key] as boolean;
    }
    if (!['slim', 'round', 'sprig'].includes(o.leafStyle as string) || !['tl-br', 'tr-bl', 'tl', 'br'].includes(o.leafPlacement as string)) throw new Error('树叶预设不支持。');
    target.leafStyle = o.leafStyle as LeafStyle; target.leafPlacement = o.leafPlacement as LeafPlacement;
    if (!Array.isArray(o.leafOffsets) || o.leafOffsets.length !== 2) throw new Error('树叶位置格式不正确。');
    target.leafOffsets = o.leafOffsets.map(v => ({ x: number(v.x, -160, 160), y: number(v.y, -160, 160), rotation: number(v.rotation, -180, 180) })) as [LeafOffset, LeafOffset];
    if (!Array.isArray(o.points) || o.points.length > 512 || (o.points.length > 0 && o.points.length < 8)) throw new Error('背景轮廓格式不正确。');
    target.points = o.points.map(v => ({ x: number(v.x, 0, 1), y: number(v.y, 0, 1) }));
    project.objects.push(target);
  }
  if (r.reference && typeof r.reference === 'object') {
    const ref = r.reference as Record<string, unknown>;
    if (typeof ref.src !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(ref.src) || ref.src.length > 24e6) throw new Error('参考底图格式不支持。');
    project.reference = { src: ref.src, name: String(ref.name).slice(0, 100), opacity: number(ref.opacity, 0, 1) };
  }
  return project;
}
