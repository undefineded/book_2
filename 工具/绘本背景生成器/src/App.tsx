import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Copy, Download, FilePlus2, FolderOpen, HelpCircle, ImagePlus, Layers, Leaf, Lock, Maximize2, Minus, MousePointer2, Paintbrush, Plus, Redo2, RotateCcw, Save, Settings2, SquareDashed, Trash2, Undo2, Unlock, X } from 'lucide-react';
import { clamp, clone, emptyProject, makeBackground, SHAPES, validateProject, type Background, type Preset, type Shape } from './model';
import { contour, insetContour, localPoints, resizeObject, simplePolygon } from './geometry';
import { EditorCanvas, type Tool, type View } from './EditorCanvas';
import { useStudio } from './store';
import { download, readLocal, saveProject, writeLocal } from './persistence';
import { exportCanvas, exportMetrics, toPNG } from './render';
import s from './App.module.css';

function Numeric({ label, value, onCommit, min = 0, max = 4096, suffix = 'px', step = 1 }: { label: string; value: number; onCommit: (value: number) => void; min?: number; max?: number; suffix?: string; step?: number }) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));
  useEffect(() => setDraft(String(Math.round(value * 100) / 100)), [value]);
  return <label className={s.numeric}><span>{label}</span><div><input aria-label={label} type="number" value={draft} min={min} max={max} step={step} onChange={e => setDraft(e.target.value)} onBlur={() => { const n = Number(draft); if (draft.trim() && Number.isFinite(n)) { const next = clamp(n, min, max); onCommit(next); setDraft(String(next)); } else setDraft(String(Math.round(value))); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /><small>{suffix}</small></div></label>;
}
function Range({ label, value, min = 0, max = 1, step = .01, onChange, display }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (n: number) => void; display?: string }) {
  const begin = useStudio(s => s.begin), end = useStudio(s => s.end);
  return <label className={s.range}><span>{label}<small>{display ?? `${Math.round(value * 100)}%`}</small></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onKeyUp={end} onBlur={end} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className={s.toggle}><span>{label}</span><input aria-label={label} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /><i /></label>;
}
function Section({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return <details className={s.section} open={open}><summary>{title}<ChevronDown size={14} /></summary><div>{children}</div></details>;
}
function ShapeIcon({ shape }: { shape: Shape }) {
  const points = contour(shape, 88, 68).map(p => `${p.x + 6},${p.y + 6}`).join(' ');
  return <svg viewBox="0 0 100 80" aria-hidden="true"><polygon points={points} fill="currentColor" /><polygon points={contour(shape, 70, 50).map(p => `${p.x + 15},${p.y + 15}`).join(' ')} fill="none" stroke="var(--preset-line, #b5a889)" strokeWidth="1.2" strokeDasharray="3 3" /></svg>;
}
function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return <button className={s.iconButton} title={title} aria-label={title} onClick={onClick} disabled={disabled}>{children}</button>;
}

export default function App() {
  const { project, selected, past, future, select, patch, change, undo, redo } = useStudio();
  const object = project.objects.find(o => o.id === selected);
  const [tool, setTool] = useState<Tool>('move'), [brush, setBrush] = useState(170), [strength, setStrength] = useState(.65);
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 }), [backdrop, setBackdrop] = useState('checker'), [safe, setSafe] = useState(false);
  const [modal, setModal] = useState<'export' | 'new' | 'help' | null>(null), [toast, setToast] = useState(''), [saved, setSaved] = useState('正在准备画布');
  const [presets, setPresets] = useState<Preset[]>([]), [ready, setReady] = useState(false), [busyDrag, setBusyDrag] = useState(false), [leafIndex, setLeafIndex] = useState(0);
  const [exportMode, setExportMode] = useState<'object' | 'canvas'>('object'), [margin, setMargin] = useState(24), [exportWidth, setExportWidth] = useState<number>(), [exportBusy, setExportBusy] = useState(false);
  const [newWidth, setNewWidth] = useState(1254), [newHeight, setNewHeight] = useState(1254);
  const [fitScale, setFitScale] = useState(.5);
  const modalRef = useRef<HTMLElement>(null);
  const fileInput = useRef<HTMLInputElement>(null), imageInput = useRef<HTMLInputElement>(null);
  const writable = !!object && !object.locked;
  const effectiveInset = object?.kind === 'fact' ? insetContour(localPoints(object), object.inset).distance : 0;
  const notice = (message: string) => setToast(message);

  useEffect(() => {
    let alive = true;
    Promise.all([readLocal<unknown>('draft'), readLocal<Preset[]>('presets')]).then(([draft, savedPresets]) => {
      if (!alive) return;
      if (draft && useStudio.getState().revision === 0) useStudio.getState().restoreDraft(validateProject(draft));
      if (Array.isArray(savedPresets)) setPresets(savedPresets.filter(p => { try { validateProject({ ...emptyProject(), objects: [p.object] }); return typeof p.name === 'string'; } catch { return false; } }));
      setSaved(draft ? '已恢复本地画布' : '画布只保存在此浏览器');
    }).catch(() => { if (alive) setSaved('可使用顶部按钮保存项目'); }).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!ready || busyDrag) return;
    setSaved('正在保存…');
    const t = setTimeout(() => { writeLocal('draft', project).then(() => setSaved('已自动保存到本地')).catch(() => setSaved('自动保存不可用，请保存项目文件')); }, 650);
    return () => clearTimeout(t);
  }, [project, ready, busyDrag]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => {
    const action = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement, editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(useStudio.getState().project); return; }
      if (modal) { if (e.key === 'Escape' && !exportBusy) setModal(null); return; }
      if (editing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
      if (e.key.toLowerCase() === 'v') setTool('move');
      if (e.key.toLowerCase() === 'b' && writable && object?.kind === 'title' && object.phase === 'shape') setTool('push');
      if (e.key === 'Escape') setModal(null);
    };
    window.addEventListener('keydown', action); return () => window.removeEventListener('keydown', action);
  }, [modal, exportBusy, selected, project, undo, redo]);
  useEffect(() => {
    if (!modal || !modalRef.current) return;
    const before = document.activeElement as HTMLElement | null;
    const focusables = () => [...modalRef.current!.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]')];
    focusables()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables(), first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', trap);
    return () => { window.removeEventListener('keydown', trap); before?.focus(); };
  }, [modal]);
  useEffect(() => {
    const end = () => { useStudio.getState().end(); setBusyDrag(false); };
    window.addEventListener('pointerup', end); window.addEventListener('blur', end);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('blur', end); };
  }, []);

  function add(kind: 'title' | 'fact', preset?: Background) {
    if (project.objects.length >= 30) return notice('每个项目最多保留30个背景。');
    const count = project.objects.filter(o => o.kind === kind).length + 1;
    let o = makeBackground(kind, project, count);
    if (preset) { o = { ...clone(preset), id: o.id, locked: false, name: `${preset.name} 副本`, x: (project.width - preset.width) / 2, y: (project.height - preset.height) / 2 }; }
    change({ ...project, objects: [...project.objects, o] }); select(o.id); setTool('move');
    notice(kind === 'title' ? '已添加标题背景，选择「推拉」即可塑形' : '已添加纸签，调整宽高后点击「确认形状」');
  }
  function removeSelected() {
    const state = useStudio.getState(), o = state.project.objects.find(x => x.id === state.selected);
    if (!o || o.locked) return;
    state.change({ ...state.project, objects: state.project.objects.filter(x => x.id !== o.id) });
  }
  function duplicate() {
    if (!object) return; const o = { ...clone(object), id: crypto.randomUUID(), name: `${object.name} 副本`, locked: false, x: object.x + 35, y: object.y + 35 };
    if (project.objects.length >= 30) return notice('每个项目最多保留30个背景。');
    change({ ...project, objects: [...project.objects, o] }); select(o.id);
  }
  function reorder(direction: number) {
    if (!object || object.locked) return; const objects = [...project.objects], index = objects.findIndex(o => o.id === selected), next = clamp(index + direction, 0, objects.length - 1);
    [objects[index], objects[next]] = [objects[next], objects[index]]; change({ ...project, objects });
  }
  function applyShape(shape: Shape) { if (writable) patch(object.id, { shape, points: [] }); }
  function update(p: Partial<Background>) { if (writable) patch(object.id, p); }
  function savePreset() {
    if (!object) return;
    const p = { id: crypto.randomUUID(), name: object.name, object: clone(object) }, next = [...presets, p].slice(-20);
    writeLocal('presets', next).then(() => { setPresets(next); notice('已保存为自定义预设，可从左侧重复添加'); }).catch(() => notice('预设保存失败，仍可保存项目文件。'));
  }
  async function openFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 30e6) throw new Error('项目文件过大，请选择30MB以内的文件。');
      const p = validateProject(JSON.parse(await file.text()));
      if (p.objects.some(o => o.points.length && !simplePolygon(localPoints(o)))) throw new Error('项目轮廓存在交叉，请使用有效的项目文件。');
      change(p); setView({ zoom: 1, panX: 0, panY: 0 }); setTool('move'); notice('项目已打开，当前操作可撤销');
    } catch (e) { notice(e instanceof Error ? e.message : '项目无法打开。'); }
  }
  async function importImage(file?: File) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 15e6) return notice('请选择15MB以内的PNG、JPG或WebP参考图。');
    const reader = new FileReader(); reader.onload = () => change({ ...project, reference: { src: String(reader.result), name: file.name, opacity: .8 } }); reader.readAsDataURL(file);
  }
  function openExport() { setExportMode(object ? 'object' : 'canvas'); setExportWidth(undefined); setModal('export'); }
  let metrics = { x: 0, y: 0, width: project.width, height: project.height };
  if (modal === 'export') metrics = exportMetrics(project, object, { mode: exportMode, margin });
  const suggestedWidth = Math.max(32, Math.floor(Math.min(metrics.width, 4096, 4096 * metrics.width / metrics.height)));
  const outputWidth = exportWidth ?? suggestedWidth, outputHeight = Math.max(1, Math.round(metrics.height * outputWidth / metrics.width));
  async function exportPNG() {
    setExportBusy(true);
    try {
      await new Promise(r => setTimeout(r, 40));
      const c = exportCanvas(project, object, { mode: exportMode, margin, width: outputWidth });
      download(await toPNG(c), `${exportMode === 'object' ? object?.name : project.name}-透明背景.png`); notice(`已导出 ${c.width} × ${c.height}px 透明PNG`); setModal(null);
    } catch (e) { notice(e instanceof Error ? e.message : '导出失败。'); } finally { setExportBusy(false); }
  }

  return <div className={s.app}>
    <header className={s.header}>
      <div className={s.brand}><div className={s.brandMark}><Leaf size={23} strokeWidth={1.4} /></div><div><strong>纸间<span>绘本背景工坊</span></strong><small>PAPER STUDIO</small></div></div>
      <div className={s.projectTitle}><span>{project.name}</span><small><i />{saved}</small></div>
      <div className={s.headerActions}>
        <button onClick={() => setModal('new')}><FilePlus2 size={16} /><span>新建</span></button>
        <button onClick={() => fileInput.current?.click()}><FolderOpen size={16} /><span>打开</span></button>
        <button onClick={() => { saveProject(project); notice('已保存可编辑项目文件'); }}><Save size={16} /><span>保存项目</span></button>
        <span className={s.divider} />
        <IconButton title="撤销" onClick={undo} disabled={!past.length}><Undo2 size={17} /></IconButton>
        <IconButton title="重做" onClick={redo} disabled={!future.length}><Redo2 size={17} /></IconButton>
        <button className={s.primary} onClick={openExport}><Download size={16} />导出背景</button>
      </div>
    </header>
    <input ref={fileInput} type="file" accept=".json" hidden onChange={e => { openFile(e.target.files?.[0]); e.target.value = ''; }} />
    <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { importImage(e.target.files?.[0]); e.target.value = ''; }} />
    <div className={s.workspace}>
      <aside className={s.library}>
        <div className={s.libraryHeading}><span>素材工具</span><small>BACKGROUND</small></div>
        <button className={s.addCard} onClick={() => add('title')}><span className={s.titlePreview}><span /></span><span><strong>标题背景</strong><small>自由推拉 · 柔和羽化</small></span><Plus size={17} /></button>
        <button className={s.addCard} onClick={() => add('fact')}><span className={s.factPreview}><SquareDashed size={29} /><Leaf size={16} /></span><span><strong>小百科背景</strong><small>预设纸签 · 自动装饰</small></span><Plus size={17} /></button>
        <div className={s.librarySection}><h3>形状预设<span>{object?.kind === 'title' ? '可继续推拉' : '仅宽高拉伸'}</span></h3>
          <div className={s.shapes}>{SHAPES.map(shape => <button title={shape.description} aria-label={shape.name} key={shape.id} disabled={!writable} className={object?.shape === shape.id ? s.activeShape : ''} onClick={() => applyShape(shape.id)}><ShapeIcon shape={shape.id} /><span>{shape.name}</span></button>)}</div>
        </div>
        {presets.length > 0 && <div className={s.librarySection}><h3>我的预设<span>{presets.length}</span></h3><div className={s.customPresets}>{presets.map(p => <div key={p.id}><button onClick={() => add(p.object.kind, p.object)}><Plus size={13} />{p.name}</button><button aria-label={`删除预设${p.name}`} onClick={() => { const next = presets.filter(x => x.id !== p.id); writeLocal('presets', next).then(() => setPresets(next)).catch(() => notice('删除失败，请重试。')); }}><X size={12} /></button></div>)}</div></div>}
        <div className={s.objects}><h3><Layers size={14} />画布对象<span>{project.objects.length}</span></h3><div className={s.objectList}>{[...project.objects].reverse().map(o => <div key={o.id} className={`${s.objectRow} ${selected === o.id ? s.selectedObject : ''}`}><button onClick={() => { select(o.id); setTool('move'); }}><span className={o.kind === 'title' ? s.objectTitleIcon : s.objectFactIcon}>{o.kind === 'title' ? <Paintbrush size={17} /> : <Leaf size={17} />}</span><span><strong>{o.name}</strong><small>{Math.round(o.width)} × {Math.round(o.height)}px</small></span></button><button aria-label={`${o.locked ? '解锁' : '锁定'}${o.name}`} onClick={() => patch(o.id, { locked: !o.locked })}>{o.locked ? <Lock size={13} /> : <Unlock size={13} />}</button></div>)}</div></div>
        <button className={s.helpButton} onClick={() => setModal('help')}><HelpCircle size={15} />使用指南<span>?</span></button>
      </aside>

      <main className={s.main}>
        <div className={s.canvasToolbar}><div><span className={s.canvasLabel}>编辑画布</span><button className={s.canvasSize} onClick={() => { setNewWidth(project.width); setNewHeight(project.height); setModal('new'); }}>{project.width} × {project.height}<ChevronDown size={12} /></button></div><div className={s.backdropButtons}><span>预览底色</span>{[['checker', '透明'], ['white', '白色'], ['dark', '深色']].map(([id, label]) => <button title={label} aria-label={`${label}预览`} key={id} className={`${s[id]} ${backdrop === id ? s.chosenBackdrop : ''}`} onClick={() => setBackdrop(id)} />)}</div></div>
        <div className={s.canvasArea}>
          <div className={s.floatingTools}><IconButton title="选择移动 V" onClick={() => setTool('move')}><MousePointer2 size={19} className={tool === 'move' ? s.activeTool : ''} /></IconButton><span />
            <IconButton title="推拉形状 B" disabled={!writable || object?.kind !== 'title' || object.phase !== 'shape'} onClick={() => setTool('push')}><Paintbrush size={19} className={tool === 'push' ? s.activeTool : ''} /></IconButton>
            <IconButton title="局部恢复" disabled={!writable || object?.kind !== 'title' || object.phase !== 'shape'} onClick={() => setTool('restore')}><RotateCcw size={18} className={tool === 'restore' ? s.activeTool : ''} /></IconButton>
          </div>
          <EditorCanvas tool={tool} brush={brush} strength={strength} view={view} setView={setView} backdrop={backdrop} showSafe={safe} interactiveChanged={setBusyDrag} onFitScale={setFitScale} />
          <div className={s.canvasCaption}><i />{object ? object.kind === 'title' ? object.phase === 'shape' ? '用推拉画笔塑造轮廓，完成后调节边缘透明' : '柔和的阅读底，让文字自然融入画面' : object.phase === 'shape' ? '拖动四边手柄调整宽高，然后确认形状' : '纸签已装饰，可继续调整虚线与树叶' : '选择一个背景，或添加新的素材'}</div>
        </div>
        <footer className={s.statusbar}><span>空格拖动画布 · 滚轮缩放</span><div><button onClick={() => setSafe(!safe)} className={safe ? s.enabled : ''}><SquareDashed size={13} />内容安全区</button><span className={s.divider} /><IconButton title="缩小" onClick={() => setView({ ...view, zoom: clamp(view.zoom / 1.2, .2, 20) })}><Minus size={14} /></IconButton><button title="100%查看" aria-label="100%查看" onClick={() => setView({ zoom: 1 / fitScale, panX: 0, panY: 0 })}>{Math.round(view.zoom * fitScale * 100)}%</button><IconButton title="放大" onClick={() => setView({ ...view, zoom: clamp(view.zoom * 1.2, .2, 20) })}><Plus size={14} /></IconButton><IconButton title="适应画布" onClick={() => setView({ zoom: 1, panX: 0, panY: 0 })}><Maximize2 size={14} /></IconButton></div></footer>
      </main>

      <aside className={s.properties}>
        <div className={s.propertiesHeading}><Settings2 size={16} /><strong>背景属性</strong><span>{object?.kind === 'title' ? '标题' : object ? '小百科' : '未选择'}</span></div>
        {object ? <div className={s.propertyScroll}>
          <div className={s.objectName}><input aria-label="对象名称" value={object.name} disabled={object.locked} onChange={e => update({ name: e.target.value.slice(0, 60) })} /><span>{object.locked ? '对象已锁定' : object.phase === 'finished' ? '已完成形状' : '正在编辑形状'}</span></div>
          <div className={s.objectActions}><IconButton title="复制对象" onClick={duplicate}><Copy size={15} /></IconButton><IconButton title="上移一层" onClick={() => reorder(1)} disabled={!writable}><ArrowUp size={15} /></IconButton><IconButton title="下移一层" onClick={() => reorder(-1)} disabled={!writable}><ArrowDown size={15} /></IconButton><IconButton title="删除对象" onClick={removeSelected} disabled={!writable}><Trash2 size={15} /></IconButton></div>
          <fieldset disabled={object.locked} className={s.propertyFields}>
            <div className={s.dimensionGrid}><Numeric label="宽度" value={object.width} min={object.kind === 'fact' ? 180 : 90} onCommit={n => update(resizeObject(object, 'width', n))} /><Numeric label="高度" value={object.height} min={object.kind === 'fact' ? 180 : 90} onCommit={n => update(resizeObject(object, 'height', n))} /></div>
            {object.kind === 'fact' && <p className={s.hint}>宽高独立调整，树叶与线条保持比例</p>}
            <button className={object.phase === 'shape' ? s.confirmButton : s.editAgain} onClick={() => { update({ phase: object.phase === 'shape' ? 'finished' : 'shape' }); setTool('move'); }}>{object.phase === 'shape' ? <Check size={15} /> : <RotateCcw size={14} />}{object.phase === 'shape' ? object.kind === 'fact' ? '确认形状，添加装饰' : '完成形状，调节透明' : '重新调整形状'}</button>
            {object.kind === 'title' && object.phase === 'shape' && <Section title="推拉画笔" open><div className={s.segment}><button className={tool === 'push' ? s.segmentActive : ''} onClick={() => setTool('push')}>推拉</button><button className={tool === 'restore' ? s.segmentActive : ''} onClick={() => setTool('restore')}>局部恢复</button></div><Range label="画笔大小" value={brush} min={40} max={500} step={1} display={`${brush}px`} onChange={setBrush} /><Range label="推拉力度" value={strength} min={.1} max={1} onChange={setStrength} /><button className={s.textButton} onClick={() => update({ points: [] })}><RotateCcw size={12} />重置当前轮廓</button></Section>}
            {object.kind === 'title' && object.phase === 'finished' && <Section title="边缘透明" open><Range label="羽化宽度" value={object.feather} min={0} max={200} step={1} display={`${Math.round(Math.min(object.feather, Math.min(object.width, object.height) * .32))}px`} onChange={n => update({ feather: n })} /><Range label="过渡柔和度" value={object.softness} onChange={n => update({ softness: n })} /><p className={s.hint}>沿轮廓向内渐隐，中心保留阅读底色</p></Section>}
            <Section title="纸张与颜色" open><div className={s.colorLabel}><span>背景底色</span><label><input aria-label="背景底色" type="color" value={object.color} onChange={e => update({ color: e.target.value })} /><code>{object.color.toUpperCase()}</code></label></div><div className={s.palette}>{['#fff1d7', '#f5e8d7', '#e8efdf', '#e7eef2', '#f4e5dc', '#f7f5ef'].map(c => <button key={c} aria-label={`底色${c}`} style={{ background: c }} className={object.color === c ? s.paletteChosen : ''} onClick={() => update({ color: c })}>{object.color === c && <Check size={13} />}</button>)}</div><Range label="纸纹强度" value={object.texture} onChange={n => update({ texture: n })} /><Range label="暖色渐变" value={object.gradient} onChange={n => update({ gradient: n })} /><Range label="整体不透明度" value={object.opacity} onChange={n => update({ opacity: n })} /></Section>
            {object.kind === 'fact' && <Section title="纸边细线"><div className={s.colorLabel}><span>细边颜色</span><input aria-label="细边颜色" type="color" value={object.borderColor} onChange={e => update({ borderColor: e.target.value })} /></div><Range label="细边粗细" value={object.borderWidth} min={0} max={12} step={.5} display={`${object.borderWidth}px`} onChange={n => update({ borderWidth: n })} /></Section>}
            {object.kind === 'fact' && object.phase === 'finished' && <>
              <Section title="裁切虚线" open><Toggle label="显示裁切虚线" checked={object.dashed} onChange={n => update({ dashed: n })} />{object.dashed && <><div className={s.colorLabel}><span>线条颜色</span><input aria-label="虚线颜色" type="color" value={object.dashColor} onChange={e => update({ dashColor: e.target.value })} /></div><Range label="内缩距离" value={object.inset} min={4} max={100} step={1} display={`${Math.round(effectiveInset)}px`} onChange={n => update({ inset: n })} /><div className={s.dimensionGrid}><Numeric label="虚线长度" value={object.dashLength} min={2} max={60} onCommit={n => update({ dashLength: n })} /><Numeric label="虚线间隔" value={object.dashGap} min={2} max={60} onCommit={n => update({ dashGap: n })} /></div><Range label="虚线粗细" value={object.dashWidth} min={1} max={10} step={.5} display={`${object.dashWidth}px`} onChange={n => update({ dashWidth: n })} /></>}</Section>
              <Section title="树叶装饰"><Toggle label="显示树叶" checked={object.leaves} onChange={n => update({ leaves: n })} />{object.leaves && <><label className={s.selectLabel}>树叶样式<select aria-label="树叶样式" value={object.leafStyle} onChange={e => update({ leafStyle: e.target.value as Background['leafStyle'] })}><option value="slim">细长叶</option><option value="round">小圆叶</option><option value="sprig">成簇嫩叶</option></select></label><label className={s.selectLabel}>装饰位置<select aria-label="装饰位置" value={object.leafPlacement} onChange={e => update({ leafPlacement: e.target.value as Background['leafPlacement'] })}><option value="tl-br">左上 ＋ 右下</option><option value="tr-bl">右上 ＋ 左下</option><option value="tl">仅左上</option><option value="br">仅右下</option></select></label><Range label="树叶大小" value={object.leafSize} min={30} max={220} step={1} display={`${object.leafSize}px`} onChange={n => update({ leafSize: n })} /><label className={s.selectLabel}>微调叶组<select aria-label="微调叶组" value={leafIndex} onChange={e => setLeafIndex(Number(e.target.value))}><option value={0}>第一组</option><option value={1}>第二组</option></select></label>{(['x', 'y', 'rotation'] as const).map((key, i) => <Range key={key} label={['叶组水平偏移', '叶组垂直偏移', '叶组旋转'][i]} value={object.leafOffsets[leafIndex][key]} min={key === 'rotation' ? -180 : -160} max={key === 'rotation' ? 180 : 160} step={1} display={`${object.leafOffsets[leafIndex][key]}${key === 'rotation' ? '°' : 'px'}`} onChange={n => { const offsets = clone(object.leafOffsets); offsets[leafIndex][key] = n; update({ leafOffsets: offsets }); }} />)}</>}</Section>
              <Section title="空白标题条"><Toggle label="显示标题条" checked={object.header} onChange={n => update({ header: n })} />{object.header && <><div className={s.colorLabel}><span>标题条颜色</span><input aria-label="标题条颜色" type="color" value={object.headerColor} onChange={e => update({ headerColor: e.target.value })} /></div><Range label="标题条宽度" value={object.headerWidth} min={.25} max={.85} onChange={n => update({ headerWidth: n })} /><Range label="标题条高度" value={object.headerHeight} min={20} max={180} step={1} display={`${object.headerHeight}px`} onChange={n => update({ headerHeight: n })} /><Range label="标题条纵向位置" value={object.headerY} min={10} max={180} step={1} display={`${object.headerY}px`} onChange={n => update({ headerY: n })} /></>}</Section>
            </>}
            <Section title="柔和阴影"><Toggle label="显示阴影" checked={object.shadow} onChange={n => update({ shadow: n })} />{object.shadow && <><div className={s.colorLabel}><span>阴影颜色</span><input aria-label="阴影颜色" type="color" value={object.shadowColor} onChange={e => update({ shadowColor: e.target.value })} /></div><Range label="阴影强度" value={object.shadowOpacity} min={0} max={.5} onChange={n => update({ shadowOpacity: n })} /><Range label="阴影模糊" value={object.shadowBlur} min={0} max={80} step={1} display={`${object.shadowBlur}px`} onChange={n => update({ shadowBlur: n })} /><Range label="阴影水平偏移" value={object.shadowX} min={-100} max={100} step={1} display={`${object.shadowX}px`} onChange={n => update({ shadowX: n })} /><Range label="阴影垂直偏移" value={object.shadowY} min={-100} max={100} step={1} display={`${object.shadowY}px`} onChange={n => update({ shadowY: n })} /></>}</Section>
          </fieldset>
          <button className={s.savePreset} onClick={savePreset}><Plus size={14} />保存为我的预设</button>
          <Section title="参考底图"><button className={s.textButton} onClick={() => imageInput.current?.click()}><ImagePlus size={14} />{project.reference ? '更换参考图' : '导入绘本原图'}</button>{project.reference && <><Range label="参考图不透明度" value={project.reference.opacity} onChange={n => change({ ...project, reference: { ...project.reference!, opacity: n } })} /><button className={s.textButton} onClick={() => change({ ...project, reference: undefined })}>移除参考图</button></>}<p className={s.hint}>参考图只用于预览，导出背景时不包含它。</p></Section>
        </div> : <div className={s.noSelection}><MousePointer2 size={27} strokeWidth={1.2} /><strong>选择一块背景</strong><p>在画布或对象列表中选择，<br />即可调整形状与样式。</p><button onClick={() => imageInput.current?.click()}><ImagePlus size={14} />导入参考图</button></div>}
        <div className={s.propertyFoot}><span />无字素材 · 透明PNG</div>
      </aside>
    </div>
    {toast && <div role="status" className={s.toast}><Check size={15} />{toast}<button onClick={() => setToast('')} aria-label="关闭提示"><X size={13} /></button></div>}
    {modal && <div className={s.modalBackdrop} onPointerDown={e => { if (e.target === e.currentTarget && !exportBusy) setModal(null); }}><section ref={modalRef} className={s.modal} role="dialog" aria-modal="true" aria-label={modal === 'export' ? '导出背景' : modal === 'new' ? '新建画布' : '使用指南'}><button className={s.closeModal} aria-label="关闭对话框" disabled={exportBusy} onClick={() => setModal(null)}><X size={18} /></button>
      {modal === 'export' ? <><div className={s.modalIcon}><Download size={23} /></div><h2>把背景带到绘本里</h2><p className={s.modalDescription}>保留透明边缘、完整树叶与柔和阴影</p><div className={s.exportOptions}><label><input type="radio" name="exportMode" checked={exportMode === 'object'} disabled={!object} onChange={() => { setExportMode('object'); setExportWidth(undefined); }} /><span><strong>选中背景</strong><small>自动裁切，包含完整装饰</small></span></label><label><input type="radio" name="exportMode" checked={exportMode === 'canvas'} onChange={() => { setExportMode('canvas'); setExportWidth(undefined); }} /><span><strong>整个画布</strong><small>保留全部背景的位置</small></span></label></div><div className={s.dimensionGrid}><Numeric label="导出宽度" min={32} max={4096} value={outputWidth} onCommit={setExportWidth} /><label className={s.numeric}><span>导出高度</span><div><output>{outputHeight}</output><small>px</small></div></label></div>{exportMode === 'object' && <Numeric label="四边透明余量" value={margin} min={0} max={200} onCommit={n => { setMargin(n); setExportWidth(undefined); }} />}<div className={s.exportNote}><Check size={13} />PNG · RGBA透明 · 背景中不包含文字</div>{outputHeight > 4096 && <p role="alert" className={s.hint}>高度超过4096px，请将宽度减小到{suggestedWidth}px或更小。</p>}<button className={`${s.primary} ${s.wide}`} disabled={exportBusy || outputHeight > 4096} onClick={exportPNG}><Download size={16} />{exportBusy ? '正在绘制高清背景…' : `下载透明PNG · ${outputWidth} × ${outputHeight}`}</button></>
      : modal === 'new' ? <><div className={s.modalIcon}><FilePlus2 size={23} /></div><h2>新的一页，从这里开始</h2><p className={s.modalDescription}>新建空白画布，可通过撤销返回当前项目</p><div className={s.dimensionGrid}><Numeric label="画布宽度" value={newWidth} min={256} max={4096} onCommit={setNewWidth} /><Numeric label="画布高度" value={newHeight} min={256} max={4096} onCommit={setNewHeight} /></div><div className={s.sizePresets}>{[[1254, 1254], [1600, 1000], [2000, 2000]].map(([w, h]) => <button key={w} onClick={() => { setNewWidth(w); setNewHeight(h); }}>{w} × {h}</button>)}</div><button className={`${s.primary} ${s.wide}`} onClick={() => { change(emptyProject(newWidth, newHeight)); setView({ zoom: 1, panX: 0, panY: 0 }); setModal(null); }}>创建空白画布</button></>
      : <><div className={s.modalIcon}><Leaf size={23} /></div><h2>给故事，一点温柔的底色</h2><p className={s.modalDescription}>所有背景均在浏览器本地制作与保存</p><div className={s.helpContent}><h3>01 · 标题背景</h3><p>添加背景，选择「推拉」画笔拖动边缘。点击完成形状，再调节羽化宽度与柔和度。</p><h3>02 · 小百科背景</h3><p>选择形状，用四边手柄独立拉宽或拉高。确认后会自动添加内缩虚线、树叶与空白标题条。</p><h3>03 · 导出与保存</h3><p>导出透明PNG用于排版；保存项目JSON可继续编辑。预览底色、安全区和参考图都不会进入PNG。</p><div className={s.shortcuts}><span>选择移动<kbd>V</kbd></span><span>推拉画笔<kbd>B</kbd></span><span>平移画布<kbd>空格</kbd></span><span>保存项目<kbd>Ctrl / ⌘ S</kbd></span><span>撤销<kbd>Ctrl / ⌘ Z</kbd></span><span>重做<kbd>Ctrl / ⌘ ⇧ Z</kbd></span></div></div></>}
    </section></div>}
  </div>;
}
