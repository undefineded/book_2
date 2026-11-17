// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { sampleProject } from './model';
import { useStudio } from './store';
import { download, saveProject, writeLocal } from './persistence';
import { exportCanvas, exportMetrics } from './render';

// DOM interaction tests are separate from the real Skia pixel tests in render.test.ts.
vi.mock('./EditorCanvas', () => ({ EditorCanvas: () => <div data-testid="editor-canvas" /> }));
vi.mock('./persistence', () => ({ readLocal: vi.fn(async () => undefined), writeLocal: vi.fn(async () => undefined), download: vi.fn(), saveProject: vi.fn() }));
vi.mock('./render', () => ({
  exportMetrics: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 1000 })),
  exportCanvas: vi.fn((_p, _o, options) => ({ width: options.width ?? 800, height: Math.round((options.width ?? 800) * 1.25) })),
  toPNG: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));
beforeEach(() => { useStudio.getState().restoreDraft(sampleProject()); vi.clearAllMocks(); });
afterEach(cleanup);
const current = () => useStudio.getState().project.objects.find(o => o.id === useStudio.getState().selected)!;

describe('编辑器界面行为', () => {
  it('确认纸签后显示装饰；宽度独立修改且能撤销重做', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^小百科背景.*预设纸签/ }));
    expect(current().phase).toBe('shape'); expect(screen.queryByLabelText('显示裁切虚线')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '确认形状，添加装饰' }));
    expect((screen.getByLabelText('显示裁切虚线') as HTMLInputElement).checked).toBe(true);
    const before = structuredClone(current());
    const width = screen.getByLabelText('宽度', { exact: true });
    fireEvent.change(width, { target: { value: '920' } }); fireEvent.blur(width);
    expect(current().width).toBe(920); expect(current().height).toBe(before.height); expect(current().leafOffsets).toEqual(before.leafOffsets);
    fireEvent.click(screen.getByRole('button', { name: '撤销' })); expect(current().width).toBe(before.width);
    fireEvent.click(screen.getByRole('button', { name: '重做' })); expect(current().width).toBe(920);
  });
  it('锁定后不可通过属性或形状预设修改对象', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '锁定小百科背景1' }));
    expect(screen.getByLabelText('宽度', { exact: true }).matches(':disabled')).toBe(true);
    expect((screen.getByRole('button', { name: '云朵纸签' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: '删除对象' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('标题从塑形切换到羽化，仍能返回继续塑形', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: /^标题背景.*自由推拉/ }));
    expect((screen.getByRole('button', { name: '推拉形状 B' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '完成形状，调节透明' }));
    expect(screen.getByLabelText('羽化宽度')).toBeTruthy(); expect(current().phase).toBe('finished');
    expect((screen.getByRole('button', { name: '推拉形状 B' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '重新调整形状' })); expect(current().phase).toBe('shape');
    expect((screen.getByRole('button', { name: '推拉形状 B' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('自定义预设进入本地存储，保存项目保留实际项目数据', async () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '保存为我的预设' }));
    await waitFor(() => expect(vi.mocked(writeLocal).mock.calls.some(c => c[0] === 'presets')).toBe(true));
    expect(screen.getByText('我的预设')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '保存项目' }));
    expect(saveProject).toHaveBeenCalledWith(useStudio.getState().project);
  });
  it('装饰超过最大导出边长时自动按比例缩小默认尺寸', () => {
    vi.mocked(exportMetrics).mockReturnValueOnce({ x: 0, y: 0, width: 4096, height: 4600 });
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '导出背景' }));
    const width = Math.floor(4096 * 4096 / 4600);
    expect((screen.getByLabelText('导出宽度') as HTMLInputElement).value).toBe(String(width));
    expect((screen.getByRole('button', { name: new RegExp(`下载透明PNG · ${width} ×`) }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('导出面板按比例更新尺寸，再调用PNG下载流程', async () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '导出背景' }));
    expect(screen.getByRole('dialog', { name: '导出背景' })).toBeTruthy();
    const width = screen.getByLabelText('导出宽度'); fireEvent.change(width, { target: { value: '1600' } }); fireEvent.blur(width);
    fireEvent.click(screen.getByRole('button', { name: /下载透明PNG · 1600 × 2000/ }));
    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(exportCanvas).toHaveBeenCalledWith(useStudio.getState().project, current(), { mode: 'object', margin: 24, width: 1600 });
    expect(vi.mocked(download).mock.calls[0][1]).toBe('小百科背景1-透明背景.png');
  });
});
