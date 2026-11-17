import { create } from 'zustand';
import { clone, sampleProject, type Background, type Project } from './model';

interface StudioState {
  project: Project; selected: string | null; past: Project[]; future: Project[]; gesture: Project | null;
  revision: number;
  select: (id: string | null) => void;
  change: (next: Project) => void;
  patch: (id: string, patch: Partial<Background>) => void;
  begin: () => void; end: () => void; undo: () => void; redo: () => void;
  restoreDraft: (project: Project) => void;
}
const initial = sampleProject();
export const useStudio = create<StudioState>((set, get) => ({
  project: initial, selected: initial.objects[1].id, past: [], future: [], gesture: null, revision: 0,
  select: id => set({ selected: id }),
  change: next => {
    const s = get();
    if (JSON.stringify(s.project) === JSON.stringify(next)) return;
    set({ project: next, past: s.gesture ? s.past : [...s.past.slice(-49), clone(s.project)], future: [], revision: s.revision + 1,
      selected: next.objects.some(o => o.id === s.selected) ? s.selected : next.objects.at(-1)?.id ?? null });
  },
  patch: (id, patch) => { const s = get(); s.change({ ...s.project, objects: s.project.objects.map(o => o.id === id ? { ...o, ...patch } : o) }); },
  begin: () => { if (!get().gesture) set({ gesture: clone(get().project) }); },
  end: () => { const s = get(); if (!s.gesture) return; set({ past: JSON.stringify(s.gesture) === JSON.stringify(s.project) ? s.past : [...s.past.slice(-49), s.gesture], gesture: null }); },
  undo: () => { const s = get(); if (!s.past.length) return; const p = s.past.at(-1)!; set({ project: p, past: s.past.slice(0, -1), future: [clone(s.project), ...s.future], gesture: null, revision: s.revision + 1, selected: p.objects.some(o => o.id === s.selected) ? s.selected : p.objects.at(-1)?.id ?? null }); },
  redo: () => { const s = get(); if (!s.future.length) return; const p = s.future[0]; set({ project: p, past: [...s.past, clone(s.project)], future: s.future.slice(1), gesture: null, revision: s.revision + 1, selected: p.objects.some(o => o.id === s.selected) ? s.selected : p.objects.at(-1)?.id ?? null }); },
  restoreDraft: p => set({ project: p, selected: p.objects.at(-1)?.id ?? null, past: [], future: [], revision: 0, gesture: null }),
}));
