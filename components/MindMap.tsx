import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Chapter, MindMapData } from '../types';
import {
  ZoomIn, ZoomOut, Maximize2, Settings2,
  Layers, BrainCircuit, Check, Loader2, Download, Clock, X,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { toPng } from 'html-to-image';
import { useAuth } from '../contexts/AuthContext';
import { saveMindMap, getMindMaps, getMindMapFromCache } from '../services/db';

type Complexity  = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
type DetailLevel = 'BRIEF' | 'STANDARD' | 'DETAILED';

interface TreeNode {
  id: string;
  data: { title: string; description: string; type?: string; isRoot: boolean };
  x: number; y: number;
  width: number; height: number;
  children: TreeNode[];
  depth: number;
}
interface Edge { id: string; x1: number; y1: number; x2: number; y2: number }

// ── Vertical (top-down) layout ────────────────────────────────────────────────
const NW = 186; const NH = 42;
const RW = 220; const RH = 50;
const HG = 22; const VG = 56;

function subtreeW(n: TreeNode, col: Set<string>): number {
  if (col.has(n.id) || !n.children.length) return n.width;
  const sum = n.children.reduce((s, c) => s + subtreeW(c, col), 0) + (n.children.length - 1) * HG;
  return Math.max(n.width, sum);
}

function placeV(n: TreeNode, cx: number, cy: number, col: Set<string>) {
  n.x = cx; n.y = cy;
  if (col.has(n.id) || !n.children.length) return;
  const childCY = cy + n.height / 2 + VG + NH / 2;
  const ws      = n.children.map(c => subtreeW(c, col));
  const totalW  = ws.reduce((a, b) => a + b, 0) + (n.children.length - 1) * HG;
  let sx = cx - totalW / 2;
  n.children.forEach((c, i) => { placeV(c, sx + ws[i] / 2, childCY, col); sx += ws[i] + HG; });
}

function flattenV(root: TreeNode, col: Set<string>) {
  const nodes: TreeNode[] = []; const edges: Edge[] = [];
  const walk = (n: TreeNode) => {
    nodes.push(n);
    if (!col.has(n.id)) {
      n.children.forEach(c => {
        edges.push({ id: `${n.id}→${c.id}`, x1: n.x, y1: n.y + n.height / 2, x2: c.x, y2: c.y - c.height / 2 });
        walk(c);
      });
    }
  };
  walk(root); return { nodes, edges };
}

function buildTree(data: { rootTitle: string; nodes: any[] }): TreeNode {
  const root: TreeNode = { id: 'root', data: { title: data.rootTitle, description: '', isRoot: true }, x: 0, y: 0, width: RW, height: RH, children: [], depth: 0 };
  const map = new Map<string, TreeNode>();
  data.nodes.forEach(n => map.set(n.id, { id: n.id, data: { ...n, isRoot: false }, x: 0, y: 0, width: NW, height: NH, children: [], depth: 0 }));
  data.nodes.forEach(n => { const node = map.get(n.id)!; const parent = (!n.parentId || n.parentId === 'root') ? null : map.get(n.parentId); (parent ?? root).children.push(node); });
  const sd = (n: TreeNode, d: number) => { n.depth = d; n.children.forEach(c => sd(c, d + 1)); };
  sd(root, 0); return root;
}

// ── Depth colour palettes ─────────────────────────────────────────────────────
const LIGHT_PAL = [
  { bg: '#fde8de', border: '#c85b32', text: '#6b2d14', sel: '#a84928' },
  { bg: '#dbeeff', border: '#4a8fc0', text: '#1a3e60', sel: '#2c68a0' },
  { bg: '#d4f5e8', border: '#2a9e6e', text: '#0e4030', sel: '#1a7050' },
  { bg: '#ede8fb', border: '#7c6ec0', text: '#342860', sel: '#5a4aa0' },
  { bg: '#fef2d4', border: '#c49020', text: '#5a3c00', sel: '#a07010' },
  { bg: '#fde4f0', border: '#b84e88', text: '#5c1840', sel: '#903870' },
];
const DARK_PAL = [
  { bg: 'rgba(200,91,50,0.18)',   border: 'rgba(200,91,50,0.70)',   text: '#f4bca4', sel: '#f0a07a' },
  { bg: 'rgba(74,143,192,0.18)',  border: 'rgba(74,143,192,0.70)',  text: '#a8d0f0', sel: '#7ab8e8' },
  { bg: 'rgba(42,158,110,0.18)',  border: 'rgba(42,158,110,0.70)',  text: '#90d4b4', sel: '#60c898' },
  { bg: 'rgba(124,110,192,0.18)', border: 'rgba(124,110,192,0.70)', text: '#c4b4f0', sel: '#a898e8' },
  { bg: 'rgba(196,144,32,0.18)',  border: 'rgba(196,144,32,0.70)',  text: '#e8cc80', sel: '#d4b040' },
  { bg: 'rgba(184,78,136,0.18)',  border: 'rgba(184,78,136,0.70)',  text: '#f0a4cc', sel: '#e070b0' },
];

// Animation entry types
interface NodeAnim { delay: number; ox: number; oy: number; }
interface EdgeAnim { delay: number; type: 'draw' | 'undraw'; }

const STAGGER = 0.05; // seconds between each child appearing

// ── Component ─────────────────────────────────────────────────────────────────
const MindMap: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const { user } = useAuth();

  const [complexity, setComplexity] = useState<Complexity>('INTERMEDIATE');
  const [detail,     setDetail]     = useState<DetailLevel>('STANDARD');
  const [mapData,    setMapData]    = useState<{ rootTitle: string; nodes: any[] } | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [history,    setHistory]    = useState<MindMapData[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos,   setPos]   = useState({ x: 0, y: 0 });
  const [smoothPan, setSmoothPan] = useState(false);
  const dragging  = useRef(false);
  const panOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const [treeRoot,   setTreeRoot]   = useState<TreeNode | null>(null);
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set());
  const [nodes,      setNodes]      = useState<TreeNode[]>([]);
  const [edges,      setEdges]      = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Animation state
  const [expandAnim,  setExpandAnim]  = useState<Map<string, NodeAnim>>(new Map());
  const [collapseAnim,setCollapseAnim]= useState<Map<string, NodeAnim>>(new Map());
  const [edgeAnims,   setEdgeAnims]   = useState<Map<string, EdgeAnim>>(new Map());
  const [busy,        setBusy]        = useState(false);

  const prevIds      = useRef<Set<string>>(new Set());
  const expandOrigin = useRef<{ x: number; y: number } | null>(null);
  const collapseRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dark-mode
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const pal = isDark ? DARK_PAL : LIGHT_PAL;

  useEffect(() => { if (user) getMindMaps(user.id, chapter.id).then(setHistory); }, [user, chapter.id]);

  // ── Layout rebuild ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!treeRoot) return;
    placeV(treeRoot, 0, 0, collapsed);
    const { nodes: ns, edges: es } = flattenV(treeRoot, collapsed);

    // Detect new nodes
    const newNodes: TreeNode[] = [];
    ns.forEach(n => { if (!prevIds.current.has(n.id)) newNodes.push(n); });
    prevIds.current = new Set(ns.map(n => n.id));

    setNodes(ns); setEdges(es);

    if (newNodes.length > 0 && expandOrigin.current) {
      const origin = expandOrigin.current;
      // Sort: shallower and left-to-right appear first
      newNodes.sort((a, b) => a.depth !== b.depth ? a.depth - b.depth : a.x - b.x);

      const nodeAnims = new Map<string, NodeAnim>();
      const eAnims    = new Map<string, EdgeAnim>();

      newNodes.forEach((n, i) => {
        nodeAnims.set(n.id, { delay: i * STAGGER, ox: origin.x - n.x, oy: origin.y - n.y });
      });

      // Edges draw AFTER their node appears — hand-drawing-the-line feel
      es.forEach(e => {
        const toId = e.id.split('→')[1];
        const na = nodeAnims.get(toId);
        if (na) eAnims.set(e.id, { delay: na.delay + 0.18, type: 'draw' });
      });

      setExpandAnim(nodeAnims);
      setEdgeAnims(eAnims);

      // Auto-pan: smoothly center on the expanded region
      autoPan(origin, newNodes);

      const totalDur = (newNodes.length - 1) * STAGGER + 0.18 + 0.38; // node stagger + edge offset + edge duration
      const t = setTimeout(() => { setExpandAnim(new Map()); setEdgeAnims(new Map()); }, totalDur * 1000);
      expandOrigin.current = null;
      return () => clearTimeout(t);
    }
    expandOrigin.current = null;
  }, [treeRoot, collapsed]);

  // ── mapData → build + fit ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapData) return;
    prevIds.current = new Set();
    const root = buildTree(mapData);
    placeV(root, 0, 0, new Set());
    setTreeRoot(root); setCollapsed(new Set()); setSelectedId(null);
    setTimeout(() => fitAllNs(flattenV(root, new Set()).nodes), 80);
  }, [mapData]);

  // ── Auto-pan ──────────────────────────────────────────────────────────────
  const autoPan = useCallback((origin: { x: number; y: number }, newNodes: TreeNode[]) => {
    if (!containerRef.current) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    const allX = [origin.x, ...newNodes.map(n => n.x)];
    const allY = [origin.y, ...newNodes.map(n => n.y + n.height / 2)];
    const cx = (Math.min(...allX) + Math.max(...allX)) / 2;
    const cy = (Math.min(...allY) + Math.max(...allY)) / 2;
    const targetPx = cw / 2 - cx * scale;
    const targetPy = ch / 2 - cy * scale;
    // Only pan if delta is significant
    setPos(prev => {
      const dx = Math.abs(targetPx - prev.x), dy = Math.abs(targetPy - prev.y);
      if (dx < 40 && dy < 40) return prev;
      setSmoothPan(true);
      setTimeout(() => setSmoothPan(false), 650);
      return { x: targetPx, y: targetPy };
    });
  }, [scale]);

  const fitAllNs = useCallback((ns: TreeNode[]) => {
    if (!containerRef.current || !ns.length) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    ns.forEach(n => { mnX = Math.min(mnX, n.x-n.width/2); mxX = Math.max(mxX, n.x+n.width/2); mnY = Math.min(mnY, n.y-n.height/2); mxY = Math.max(mxY, n.y+n.height/2); });
    const s = Math.min((cw-80)/(mxX-mnX), (ch-80)/(mxY-mnY), 1.4);
    setScale(s); setPos({ x: cw/2-((mnX+mxX)/2)*s, y: ch/2-((mnY+mxY)/2)*s });
  }, []);

  const fitAll = useCallback(() => fitAllNs(nodes), [nodes, fitAllNs]);

  // ── Expand / Collapse ─────────────────────────────────────────────────────
  const toggleCollapse = useCallback((nodeId: string) => {
    if (busy) return;

    if (collapsed.has(nodeId)) {
      // EXPAND
      const parentNode = nodes.find(n => n.id === nodeId)!;
      expandOrigin.current = { x: parentNode.x, y: parentNode.y };
      setCollapsed(prev => { const s = new Set(prev); s.delete(nodeId); return s; });
    } else {
      // COLLAPSE — animate descendants out first
      const parentNode = nodes.find(n => n.id === nodeId);
      if (!parentNode) return;
      setBusy(true);

      // Collect visible descendants (DFS), leaves first
      const leaves: TreeNode[] = []; const inner: TreeNode[] = [];
      const collect = (n: TreeNode) => {
        if (collapsed.has(n.id)) return;
        n.children.forEach(c => { collect(c); });
        if (n.id !== nodeId) (n.children.length && !collapsed.has(n.id) ? inner : leaves).push(n);
      };
      collect(parentNode);
      // Leaves animate first, then inner nodes
      const ordered = [...leaves, ...inner];

      const nodeAnims = new Map<string, NodeAnim>();
      const eAnims    = new Map<string, EdgeAnim>();

      ordered.forEach((n, i) => {
        nodeAnims.set(n.id, { delay: i * 0.05, ox: parentNode.x - n.x, oy: parentNode.y - n.y });
      });

      // Undraw edges for all collapsing nodes
      edges.forEach(e => {
        const toId = e.id.split('→')[1];
        if (nodeAnims.has(toId)) {
          const na = nodeAnims.get(toId)!;
          eAnims.set(e.id, { delay: na.delay, type: 'undraw' }); // edge retracts as node shrinks
        }
      });

      setCollapseAnim(nodeAnims);
      setEdgeAnims(eAnims);

      const totalDur = ((ordered.length - 1) * 0.05 + 0.36) * 1000;
      if (collapseRef.current) clearTimeout(collapseRef.current);
      collapseRef.current = setTimeout(() => {
        setCollapsed(prev => new Set([...prev, nodeId]));
        setCollapseAnim(new Map()); setEdgeAnims(new Map());
        setBusy(false);
      }, totalDur);
    }
  }, [busy, collapsed, nodes, edges]);

  const expandAll = useCallback(() => {
    if (collapseRef.current) clearTimeout(collapseRef.current);
    setCollapseAnim(new Map()); setEdgeAnims(new Map());
    expandOrigin.current = null; setBusy(false);
    setCollapsed(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    if (!treeRoot || busy) return;
    setCollapseAnim(new Map()); setEdgeAnims(new Map()); setBusy(false);
    const all = new Set<string>();
    const w = (n: TreeNode) => { if (n.children.length) { all.add(n.id); n.children.forEach(w); } };
    w(treeRoot); setCollapsed(all);
  }, [treeRoot, busy]);

  const handleGenerate = async () => {
    setIsLoading(true);
    const data = await getMindMapFromCache(chapter.id, complexity, detail);
    if (data) {
      setMapData(data);
      if (user) {
        const e: MindMapData = { id: Date.now().toString(), chapterId: chapter.id, timestamp: Date.now(), config: { complexity, detail } };
        await saveMindMap(user.id, chapter.id, e);
        setHistory(p => [e, ...p].slice(0, 5));
      }
    }
    setIsLoading(false);
  };

  // ── Pan/zoom handlers ─────────────────────────────────────────────────────
  const onMD = (e: React.MouseEvent) => { if ((e.target as HTMLElement).closest('.mmn')) return; dragging.current = true; panOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }; };
  const onMM = (e: React.MouseEvent) => { if (!dragging.current) return; setPos({ x: panOrigin.current.px + e.clientX - panOrigin.current.mx, y: panOrigin.current.py + e.clientY - panOrigin.current.my }); };
  const onMU = () => { dragging.current = false; };

  const lt = useRef<{ x: number; y: number } | null>(null);
  const lp = useRef<number | null>(null);
  const onTS = (e: React.TouchEvent) => { if ((e.target as HTMLElement).closest('.mmn')) return; if (e.touches.length === 1) { lt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; lp.current = null; } else if (e.touches.length === 2) { lt.current = null; lp.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); } };
  const onTM = (e: React.TouchEvent) => { if (e.touches.length === 1 && lt.current) { setPos(p => ({ x: p.x + e.touches[0].clientX - lt.current!.x, y: p.y + e.touches[0].clientY - lt.current!.y })); lt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else if (e.touches.length === 2 && lp.current !== null) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setScale(s => Math.min(Math.max(s * (d / lp.current!), 0.1), 4)); lp.current = d; } };
  const onTE = () => { lt.current = null; lp.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const ns = Math.min(Math.max(scale * (1 - e.deltaY * 0.001), 0.1), 4);
    setScale(ns); setPos(p => ({ x: mx - (ns / scale) * (mx - p.x), y: my - (ns / scale) * (my - p.y) }));
  };

  const handleDownload = async () => {
    if (!containerRef.current || !nodes.length) return;
    fitAll(); await new Promise(r => setTimeout(r, 140));
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--cs-surface').trim() || '#f7f9fe';
      const url = await toPng(containerRef.current, { backgroundColor: bg, pixelRatio: 2 });
      Object.assign(document.createElement('a'), { href: url, download: `mindmap-${chapter.title}.png` }).click();
    } catch (err) { console.error(err); }
  };

  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;

  // CSS var injection for node animations
  const cssVarEntries = [...expandAnim.entries(), ...collapseAnim.entries()];

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIG SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (!mapData) {
    return (
      <div className="h-full w-full overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto py-6 px-4 animate-in fade-in duration-500 pb-8">
          <div className="text-center mb-10">
            <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
            </div>
            <h2 className="font-headline text-4xl text-on-surface mb-2">Generate Mind Map</h2>
            <p className="text-secondary text-sm">Choose your settings, then generate.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card">
              <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-primary-fixed text-primary rounded-lg"><Layers className="w-5 h-5" /></div><h3 className="font-bold text-on-surface">Detail Level</h3></div>
              {(['BRIEF','STANDARD','DETAILED'] as DetailLevel[]).map(lv => (
                <button key={lv} onClick={() => setDetail(lv)} className={`w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-all ${detail === lv ? 'bg-primary-fixed text-primary border-2 border-primary' : 'border-2 border-outline-variant hover:border-primary/40'}`}>
                  <span className="text-sm font-medium text-on-surface capitalize">{lv.toLowerCase()}</span>{detail === lv && <Check className="w-4 h-4 text-primary" />}
                </button>))}
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-card">
              <div className="flex items-center gap-2 mb-4"><div className="p-2 bg-secondary-fixed text-on-secondary-fixed-variant rounded-lg"><BrainCircuit className="w-5 h-5" /></div><h3 className="font-bold text-on-surface">Complexity</h3></div>
              {(['BASIC','INTERMEDIATE','ADVANCED'] as Complexity[]).map(cm => (
                <button key={cm} onClick={() => setComplexity(cm)} className={`w-full flex items-center justify-between p-3 rounded-xl mb-2 transition-all ${complexity === cm ? 'bg-primary-fixed text-primary border-2 border-primary' : 'border-2 border-outline-variant hover:border-primary/40'}`}>
                  <span className="text-sm font-medium text-on-surface capitalize">{cm.toLowerCase()}</span>{complexity === cm && <Check className="w-4 h-4 text-primary" />}
                </button>))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-50">
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Generating…</> : <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>Generate Map</>}
            </button>
            {history.length > 0 && (
              <div className="w-full max-w-lg">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">Recent History</p>
                {history.map(h => (
                  <button key={h.id} onClick={async () => { setIsLoading(true); const d = await getMindMapFromCache(chapter.id, h.config.complexity, h.config.detail); if (d) setMapData(d); setIsLoading(false); }}
                    className="w-full flex items-center gap-3 p-3 mb-2 bg-surface-container-lowest rounded-xl hover:bg-surface-container-low transition-colors text-left shadow-card">
                    <Clock className="w-4 h-4 text-secondary shrink-0" />
                    <div className="min-w-0"><p className="text-sm font-medium text-on-surface">{new Date(h.timestamp).toLocaleDateString()} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="text-xs text-secondary">{h.config.complexity} · {h.config.detail}</p></div>
                  </button>))}
              </div>)}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CANVAS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  const btnCls = 'mmn flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-surface-container text-secondary hover:text-on-surface';
  const edgeC  = isDark ? 'rgba(140,210,190,0.55)' : 'rgba(80,130,110,0.35)';
  const dotC   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-surface dot-grid">

      {/* CSS var injection for animation offsets */}
      {cssVarEntries.length > 0 && (
        <style>{cssVarEntries.map(([id, v]) => `[data-nid="${id}"]{--mm-ox:${v.ox}px;--mm-oy:${v.oy}px}`).join('\n')}</style>
      )}

      {/* Controls */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-0.5 glass-white rounded-xl shadow-card p-1">
        <button onClick={() => setScale(s => Math.min(s+0.25,4))}   title="Zoom In"      className={btnCls}><ZoomIn    className="w-3.5 h-3.5"/></button>
        <button onClick={() => setScale(s => Math.max(s-0.25,0.1))} title="Zoom Out"     className={btnCls}><ZoomOut   className="w-3.5 h-3.5"/></button>
        <button onClick={fitAll}                                       title="Fit"         className={btnCls}><Maximize2 className="w-3.5 h-3.5"/></button>
        <div className="h-px bg-outline-variant/20 mx-1 my-0.5"/>
        <button onClick={expandAll}   title="Expand All"   className={btnCls}><span className="material-symbols-outlined text-[15px]">unfold_more</span></button>
        <button onClick={collapseAll} title="Collapse All" className={btnCls}><span className="material-symbols-outlined text-[15px]">unfold_less</span></button>
        <div className="h-px bg-outline-variant/20 mx-1 my-0.5"/>
        <button onClick={handleDownload} title="Download"  className={btnCls}><Download   className="w-3.5 h-3.5"/></button>
        <button onClick={() => { setMapData(null); setNodes([]); setEdges([]); setSelectedId(null); setTreeRoot(null); }} title="Reconfigure" className={btnCls}><Settings2 className="w-3.5 h-3.5"/></button>
      </div>

      {/* Chapter label */}
      <div className="absolute top-3 left-3 z-30 glass-white rounded-xl shadow-card px-3 py-2 max-w-[55vw] pointer-events-none">
        <p className="text-xs font-bold text-on-surface truncate">{chapter.title}</p>
        <p className="text-[10px] text-secondary uppercase tracking-wider">{complexity} · {detail}</p>
      </div>

      {/* Hint */}
      {!selectedId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-[10px] text-secondary glass-white px-3 py-1 rounded-full shadow-card">Scroll to zoom · drag to pan · tap ˅ to expand</p>
        </div>
      )}

      {/* Viewport */}
      <div ref={containerRef} className="flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE} onWheel={onWheel}>

        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <defs>
            <pattern id="mmgrid" x={(pos.x%(20*scale)).toFixed(2)} y={(pos.y%(20*scale)).toFixed(2)} width={(20*scale).toFixed(2)} height={(20*scale).toFixed(2)} patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.9" fill={dotC}/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mmgrid)"/>
        </svg>

        {/* Canvas — single transform; SVG edges + nodes share the same coordinate space */}
        <div ref={canvasRef} style={{
          position: 'absolute', top: 0, left: 0,
          transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          transition: smoothPan ? 'transform 0.60s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
        }}>
          {/* SVG: connector lines with draw/undraw animation */}
          <svg style={{ position:'absolute', top:-4000, left:-4000, width:8000, height:8000, overflow:'visible', pointerEvents:'none' }}>
            <defs>
              {/* Glow filter for dark mode luminous connectors */}
              <filter id="mm-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {edges.map(e => {
              const x1 = e.x1+4000, y1 = e.y1+4000, x2 = e.x2+4000, y2 = e.y2+4000;
              const dy = y2 - y1;
              const d  = `M ${x1} ${y1} C ${x1} ${y1+dy*0.55}, ${x2} ${y2-dy*0.55}, ${x2} ${y2}`;
              const ea = edgeAnims.get(e.id);

              return (
                <path
                  key={e.id}
                  d={d}
                  fill="none"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  stroke={edgeC}
                  filter={isDark ? 'url(#mm-glow)' : undefined}
                  strokeDasharray={ea ? 2000 : undefined}
                  style={ea ? {
                    animation: `mm-line-${ea.type} 0.36s cubic-bezier(0.25,0.46,0.45,0.94) ${ea.delay}s both`,
                  } : undefined}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const isRoot    = node.data.isRoot;
            const isSel     = selectedId === node.id;
            const hasKids   = node.children.length > 0;
            const isCol     = collapsed.has(node.id);
            const ci        = Math.min(node.depth, pal.length - 1);
            const c         = pal[ci];
            const exAnim    = expandAnim.get(node.id);
            const coAnim    = collapseAnim.get(node.id);
            const isAnimating = exAnim || coAnim;
            const animType  = exAnim ? 'expand' : coAnim ? 'collapse' : null;
            const animDelay = (exAnim?.delay ?? coAnim?.delay ?? 0);

            // Glow shadow
            const nodeShadow = isSel
              ? isDark
                ? `0 0 0 2px ${c.sel}, 0 0 20px ${c.border}88, 0 8px 32px rgba(0,0,0,0.8)`
                : `0 0 0 2.5px ${c.sel}, 0 4px 20px ${c.border}55`
              : isDark
                ? `0 0 0 1px ${c.border}88, 0 0 14px ${c.border}44, 0 4px 16px rgba(0,0,0,0.6)`
                : `0 2px 10px rgba(0,0,0,0.09), 0 0 0 1px ${c.border}33`;

            return (
              <div
                key={node.id}
                data-nid={node.id}
                className="mmn absolute flex items-center cursor-pointer select-none"
                style={{
                  left:         node.x - node.width  / 2,
                  top:          node.y - node.height / 2,
                  width:        node.width,
                  height:       node.height,
                  borderRadius: node.height / 2,
                  background:   c.bg,
                  border:       `1.5px solid ${isSel ? c.sel : c.border}`,
                  boxShadow:    nodeShadow,
                  transition:   isAnimating
                    ? 'border-color 0.15s, box-shadow 0.15s'
                    : 'left 0.32s cubic-bezier(0.25,0.46,0.45,0.94), top 0.32s cubic-bezier(0.25,0.46,0.45,0.94), border-color 0.15s, box-shadow 0.15s',
                  animation:    animType
                    ? `mm-node-${animType} 0.28s cubic-bezier(0.25,0.46,0.45,0.94) ${animDelay}s both`
                    : undefined,
                  zIndex:       isSel ? 20 : 10,
                  overflow:     'hidden',
                }}
                onClick={() => setSelectedId(p => p === node.id ? null : node.id)}
              >
                {/* Label */}
                <span style={{
                  color:        c.text,
                  fontSize:     isRoot ? 14 : 12.5,
                  fontWeight:   isRoot ? 600 : 500,
                  flex:         1,
                  paddingLeft:  node.height / 2,
                  paddingRight: hasKids ? 4 : node.height / 2,
                  overflow:     'hidden',
                  display:      '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight:   1.28,
                } as React.CSSProperties}>
                  {node.data.title}
                </span>

                {/* Chevron — rotates 90° smoothly; ˅ down when expanded, points right when collapsed */}
                {hasKids && (
                  <button
                    className="mmn shrink-0 flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); toggleCollapse(node.id); }}
                    style={{
                      width:        node.height - 4,
                      height:       node.height - 4,
                      marginRight:  3,
                      borderRadius: '50%',
                      background:   c.bg,
                      border:       `2px solid ${c.border}`,
                      color:        c.border,
                      fontSize:     17,
                      fontWeight:   700,
                      lineHeight:   1,
                      flexShrink:   0,
                      transition:   'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94), background 0.15s',
                      transform:    isCol ? 'rotate(-90deg)' : 'rotate(0deg)',
                    }}
                  >
                    ˅
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom-sheet: node detail */}
      {selectedNode && !selectedNode.data.isRoot && (
        <div className="absolute bottom-0 left-0 right-0 z-40 bg-surface-container-lowest animate-in slide-in-from-bottom duration-250"
          style={{ maxHeight: '42%', borderTop: '1px solid rgba(199,196,216,0.25)', boxShadow: '0 -6px 32px rgba(15,23,42,0.14)' }}>
          <div className="flex justify-center pt-2 pb-1"><div className="w-10 h-1 rounded-full bg-outline-variant"/></div>
          <div className="flex items-start justify-between px-4 pb-2">
            <div className="min-w-0 pr-3">
              {selectedNode.data.type && <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-fixed text-primary mb-1">{selectedNode.data.type}</span>}
              <h3 className="font-headline text-base text-on-surface leading-snug">{selectedNode.data.title}</h3>
            </div>
            <button onClick={() => setSelectedId(null)} className="shrink-0 p-2 rounded-lg hover:bg-surface-container text-secondary mt-0.5 transition-colors"><X className="w-5 h-5"/></button>
          </div>
          <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(42vh - 80px)' }}>
            <MarkdownRenderer content={selectedNode.data.description || 'No description available.'} className="text-sm text-on-surface-variant leading-relaxed"/>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;
