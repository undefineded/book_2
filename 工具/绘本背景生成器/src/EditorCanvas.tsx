import { useEffect, useRef, useState } from 'react';
import { clamp, type Background, type Point } from './model';
import { deform, inside, localPoints, resizeObject } from './geometry';
import { drawProject, safeRect } from './render';
import { useStudio } from './store';

export type Tool = 'move' | 'push' | 'restore';
export interface View { zoom: number; panX: number; panY: number }
type Drag = { type: 'move' | 'brush' | 'resize' | 'pan'; last: Point; start: Point; original?: Background; side?: string; pan?: Point };
export function EditorCanvas({ tool, brush, strength, view, setView, backdrop, showSafe, interactiveChanged, onFitScale }: {
  tool: Tool; brush: number; strength: number; view: View; setView: (v: View) => void;
  backdrop: string; showSafe: boolean; interactiveChanged: (active: boolean) => void;
  onFitScale: (fit: number) => void;
}) {
  const project = useStudio(s => s.project), selected = useStudio(s => s.selected);
  const ref = useRef<HTMLCanvasElement>(null), wrap = useRef<HTMLDivElement>(null), drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ width: 500, height: 650 }), [reference, setReference] = useState<HTMLImageElement>();
  const [cursor, setCursor] = useState<Point | null>(null), [space, setSpace] = useState(false), [active, setActive] = useState(false);
  const fit = Math.min((size.width - 86) / project.width, (size.height - 86) / project.height), scale = Math.max(.025, fit * view.zoom);
  const ox = (size.width - project.width * scale) / 2 + view.panX, oy = (size.height - project.height * scale) / 2 + view.panY;
  const current = project.objects.find(o => o.id === selected);
  const brushEnabled = current?.kind === 'title' && current.phase === 'shape' && tool !== 'move' && !current.locked;
  useEffect(() => onFitScale(fit), [fit, onFitScale]);

  useEffect(() => {
    if (!wrap.current) return;
    const observer = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    observer.observe(wrap.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setReference(undefined); if (!project.reference) return;
    const image = new Image(); let alive = true;
    image.onload = () => { if (alive) setReference(image); }; image.src = project.reference.src;
    return () => { alive = false; };
  }, [project.reference?.src]);
  useEffect(() => {
    const editable = (target: EventTarget | null) => target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
    const down = (e: KeyboardEvent) => { if (e.code === 'Space' && !editable(e.target)) { setSpace(true); e.preventDefault(); } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpace(false); };
    const blur = () => setSpace(false);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.width * ratio); c.height = Math.round(size.height * ratio);
    const ctx = c.getContext('2d')!; ctx.scale(ratio, ratio); ctx.clearRect(0, 0, size.width, size.height);
    ctx.save(); ctx.shadowColor = 'rgba(49,44,37,.14)'; ctx.shadowBlur = 25; ctx.shadowOffsetY = 5; ctx.fillStyle = '#ffffff'; ctx.fillRect(ox, oy, project.width * scale, project.height * scale); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, project.width * scale, project.height * scale); ctx.clip();
    if (backdrop === 'checker') {
      const tile = 12; ctx.fillStyle = '#fff'; ctx.fillRect(ox, oy, project.width * scale, project.height * scale);
      ctx.fillStyle = '#f0efec';
      const right = ox + project.width * scale, bottom = oy + project.height * scale;
      for (let y = oy, row = 0; y < bottom; y += tile, row++) for (let x = ox, col = 0; x < right; x += tile, col++) if ((row + col) % 2 === 0) ctx.fillRect(x, y, tile, tile);
    } else { ctx.fillStyle = backdrop === 'dark' ? '#34433f' : '#fff'; ctx.fillRect(ox, oy, project.width * scale, project.height * scale); }
    ctx.translate(ox, oy); ctx.scale(scale, scale); drawProject(ctx, project, active, reference); ctx.restore();
    if (current) {
      ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
      const { x, y, width, height } = current;
      ctx.strokeStyle = current.locked ? '#a4aaa3' : '#467969'; ctx.lineWidth = 1 / scale; ctx.setLineDash([]); ctx.strokeRect(x, y, width, height);
      if (showSafe) {
        const b = safeRect(current); ctx.strokeStyle = 'rgba(79,121,104,.65)'; ctx.setLineDash([5 / scale, 4 / scale]);
        ctx.strokeRect(x + b.x, y + b.y, b.width, b.height); ctx.setLineDash([]);
      }
      if (!current.locked && !brushEnabled) {
        const r = 4 / scale;
        for (const p of [{ x, y: y + height / 2 }, { x: x + width, y: y + height / 2 }, { x: x + width / 2, y }, { x: x + width / 2, y: y + height }]) {
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(p.x - r, p.y - r, 2 * r, 2 * r, 1 / scale); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (brushEnabled && cursor && !space) {
      ctx.beginPath(); ctx.arc(cursor.x, cursor.y, brush * scale / 2, 0, Math.PI * 2); ctx.strokeStyle = tool === 'restore' ? '#bf8051' : '#497d6a'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cursor.x - 3, cursor.y); ctx.lineTo(cursor.x + 3, cursor.y); ctx.moveTo(cursor.x, cursor.y - 3); ctx.lineTo(cursor.x, cursor.y + 3); ctx.stroke();
    }
  }, [project, selected, size, view, backdrop, showSafe, reference, cursor, brush, tool, space, active]);

  const screen = (e: { clientX: number; clientY: number }) => { const r = ref.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const world = (p: Point) => ({ x: (p.x - ox) / scale, y: (p.y - oy) / scale });
  function begin(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0 && e.button !== 1) return;
    const p = screen(e), w = world(p); ref.current!.setPointerCapture(e.pointerId);
    if (space || e.button === 1) { drag.current = { type: 'pan', last: p, start: p, pan: { x: view.panX, y: view.panY } }; return; }
    const store = useStudio.getState();
    if (brushEnabled && current) {
      store.begin(); drag.current = { type: 'brush', last: w, start: w, original: current }; setActive(true); interactiveChanged(true); return;
    }
    if (current && !current.locked) {
      const handles = { left: { x: current.x, y: current.y + current.height / 2 }, right: { x: current.x + current.width, y: current.y + current.height / 2 }, top: { x: current.x + current.width / 2, y: current.y }, bottom: { x: current.x + current.width / 2, y: current.y + current.height } };
      const side = Object.entries(handles).find(([, h]) => Math.hypot(w.x - h.x, w.y - h.y) < 11 / scale)?.[0];
      if (side) { store.begin(); drag.current = { type: 'resize', last: w, start: w, original: current, side }; setActive(true); interactiveChanged(true); return; }
    }
    const hit = [...project.objects].reverse().find(o => inside({ x: w.x - o.x, y: w.y - o.y }, localPoints(o)));
    store.select(hit?.id ?? null);
    if (hit && !hit.locked) { store.begin(); drag.current = { type: 'move', last: w, start: w, original: hit }; setActive(true); interactiveChanged(true); }
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = screen(e), w = world(p); setCursor(p); const d = drag.current; if (!d) return;
    if (d.type === 'pan') { setView({ ...view, panX: d.pan!.x + p.x - d.start.x, panY: d.pan!.y + p.y - d.start.y }); return; }
    const store = useStudio.getState(), target = store.project.objects.find(o => o.id === d.original!.id); if (!target) return;
    if (d.type === 'move') store.patch(target.id, { x: d.original!.x + w.x - d.start.x, y: d.original!.y + w.y - d.start.y });
    if (d.type === 'brush') {
      const next = deform(target, { x: d.last.x - target.x, y: d.last.y - target.y }, { x: w.x - d.last.x, y: w.y - d.last.y }, brush / 2, strength, tool === 'restore');
      if (next !== target) store.patch(target.id, next);
    }
    if (d.type === 'resize') {
      const o = d.original!, side = d.side!, horizontal = side === 'left' || side === 'right', axis = horizontal ? 'width' : 'height';
      const delta = horizontal ? w.x - d.start.x : w.y - d.start.y;
      const next = resizeObject(o, axis, o[axis] + (side === 'left' || side === 'top' ? -delta : delta));
      if (side === 'left') next.x = o.x + o.width - next.width;
      if (side === 'top') next.y = o.y + o.height - next.height;
      store.patch(o.id, next);
    }
    d.last = w;
  }
  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    if (ref.current?.hasPointerCapture(e.pointerId)) ref.current.releasePointerCapture(e.pointerId);
    useStudio.getState().end(); drag.current = null; setActive(false); interactiveChanged(false);
  }
  return <div ref={wrap} className="canvasViewport" data-testid="canvas-viewport">
    <canvas ref={ref} aria-label="背景编辑画布" data-testid="editor-canvas" style={{ width: size.width, height: size.height, cursor: space ? 'grab' : brushEnabled ? 'none' : 'default', touchAction: 'none' }}
      onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={() => { useStudio.getState().end(); drag.current = null; setActive(false); interactiveChanged(false); }} onPointerLeave={() => setCursor(null)}
      onWheel={e => { const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1; setView({ ...view, zoom: clamp(view.zoom * delta, .2, 20) }); }} />
    {!project.objects.length && <div className="emptyCanvas"><span>让每一个发现，都有温柔的底色</span><small>从左侧添加一块背景，开始制作</small></div>}
  </div>;
}
