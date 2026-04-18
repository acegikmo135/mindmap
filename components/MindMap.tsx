import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Chapter, MindMapData } from '../types';
import {
  ZoomIn, ZoomOut, Maximize2, Settings2, Sparkles,
  Layers, BrainCircuit, Check, Loader2, Download, Clock, X,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { generateMindMapData } from '../services/geminiService';
import { toPng } from 'html-to-image';
import { useAuth } from '../contexts/AuthContext';
import { saveMindMap, getMindMaps } from '../services/db';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Layout constants ──────────────────────────────────────────────────────────
const NW = 180;   // node width
const NH = 64;    // node height
const RW = 220;   // root width
const RH = 80;    // root height
const VG = 90;    // vertical gap
const HG = 30;    // horizontal gap

// ── Layout helpers ────────────────────────────────────────────────────────────
function subtreeW(n: TreeNode): number {
  if (!n.children.length) return n.width;
  const sum = n.children.reduce((s, c) => s + subtreeW(c), 0);
  return Math.max(n.width, sum + (n.children.length - 1) * HG);
}

function place(n: TreeNode, x: number, y: number) {
  n.x = x; n.y = y;
  if (!n.children.length) return;
  const ws   = n.children.map(subtreeW);
  const tot  = ws.reduce((a, b) => a + b, 0) + (n.children.length - 1) * HG;
  let cx = x - tot / 2;
  n.children.forEach((c, i) => {
    place(c, cx + ws[i] / 2, y + n.height / 2 + VG + c.height / 2);
    cx += ws[i] + HG;
  });
}

function flatten(root: TreeNode) {
  const nodes: TreeNode[] = [];
  const edges: Edge[] = [];
  const walk = (n: TreeNode) => {
    nodes.push(n);
    n.children.forEach(c => {
      edges.push({ id: `${n.id}-${c.id}`, x1: n.x, y1: n.y + n.height / 2, x2: c.x, y2: c.y - c.height / 2 });
      walk(c);
    });
  };
  walk(root);
  return { nodes, edges };
}

function buildTree(data: { rootTitle: string; nodes: any[] }): TreeNode {
  const root: TreeNode = {
    id: 'root', data: { title: data.rootTitle, description: '', isRoot: true },
    x: 0, y: 0, width: RW, height: RH, children: [], depth: 0,
  };
  const map = new Map<string, TreeNode>();
  data.nodes.forEach(n =>
    map.set(n.id, { id: n.id, data: { ...n, isRoot: false }, x: 0, y: 0, width: NW, height: NH, children: [], depth: 0 })
  );
  data.nodes.forEach(n => {
    const node   = map.get(n.id)!;
    const parent = (!n.parentId || n.parentId === 'root') ? null : map.get(n.parentId);
    (parent ?? root).children.push(node);
  });
  const depth = (n: TreeNode, d: number) => { n.depth = d; n.children.forEach(c => depth(c, d + 1)); };
  depth(root, 0);
  subtreeW(root);
  place(root, 0, 0);
  return root;
}

// ── Depth colours (tailwind safe-listed strings) ──────────────────────────────
const DEPTH_BG   = ['#4f46e5','#2563eb','#7c3aed','#0891b2','#059669','#d97706'];
const DEPTH_RING = ['#4338ca','#1d4ed8','#6d28d9','#0e7490','#047857','#b45309'];

// ── Main component ────────────────────────────────────────────────────────────
const MindMap: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const { user } = useAuth();

  // ── Config ──────────────────────────────────────────────────────────────────
  const [complexity, setComplexity] = useState<Complexity>('INTERMEDIATE');
  const [detail,     setDetail]     = useState<DetailLevel>('STANDARD');
  const [mapData,    setMapData]    = useState<{ rootTitle: string; nodes: any[] } | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  const [history,    setHistory]    = useState<MindMapData[]>([]);

  // ── Canvas state ─────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos,   setPos]   = useState({ x: 0, y: 0 });
  const dragging  = useRef(false);
  const panOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // ── Tree ─────────────────────────────────────────────────────────────────────
  const [nodes,      setNodes]      = useState<TreeNode[]>([]);
  const [edges,      setEdges]      = useState<Edge[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── History load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) getMindMaps(user.id, chapter.id).then(setHistory);
  }, [user, chapter.id]);

  // ── Build layout on new data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapData) return;
    const root = buildTree(mapData);
    const { nodes: ns, edges: es } = flatten(root);
    setNodes(ns); setEdges(es); setSelectedId(null);
    setTimeout(() => fitAll(ns), 60);
  }, [mapData]);

  // ── Fit all nodes into viewport ───────────────────────────────────────────────
  const fitAll = useCallback((ns: TreeNode[] = nodes) => {
    if (!containerRef.current || !ns.length) return;
    const { clientWidth: cw, clientHeight: ch } = containerRef.current;
    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    ns.forEach(n => {
      mnX = Math.min(mnX, n.x - n.width / 2); mxX = Math.max(mxX, n.x + n.width / 2);
      mnY = Math.min(mnY, n.y - n.height / 2); mxY = Math.max(mxY, n.y + n.height / 2);
    });
    const PAD = 48;
    const s   = Math.min((cw - PAD * 2) / (mxX - mnX), (ch - PAD * 2) / (mxY - mnY), 1.2);
    setScale(s);
    setPos({ x: cw / 2 - ((mnX + mxX) / 2) * s, y: ch / 2 - ((mnY + mxY) / 2) * s });
  }, [nodes]);

  // ── SVG bounding rect (with viewBox fix) ─────────────────────────────────────
  const svgBox = useMemo(() => {
    if (!nodes.length) return { x: -500, y: -500, w: 1000, h: 1000 };
    let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
    nodes.forEach(n => {
      mnX = Math.min(mnX, n.x - n.width / 2); mxX = Math.max(mxX, n.x + n.width / 2);
      mnY = Math.min(mnY, n.y - n.height / 2); mxY = Math.max(mxY, n.y + n.height / 2);
    });
    const P = 100;
    return { x: mnX - P, y: mnY - P, w: mxX - mnX + P * 2, h: mxY - mnY + P * 2 };
  }, [nodes]);

  // ── Generate ──────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsLoading(true);
    const data = await generateMindMapData(chapter.title, complexity, detail);
    if (data && user) {
      setMapData(data);
      const entry: MindMapData = {
        id: Date.now().toString(), chapterId: chapter.id, timestamp: Date.now(),
        config: { complexity, detail }, data,
      };
      await saveMindMap(user.id, chapter.id, entry);
      setHistory(p => [entry, ...p].slice(0, 5));
    }
    setIsLoading(false);
  };

  // ── Mouse pan ────────────────────────────────────────────────────────────────
  const onMD = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mmn')) return;
    dragging.current = true;
    panOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };
  const onMM = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    setPos({ x: panOrigin.current.px + e.clientX - panOrigin.current.mx,
              y: panOrigin.current.py + e.clientY - panOrigin.current.my });
  };
  const onMU = () => { dragging.current = false; };

  // ── Touch ────────────────────────────────────────────────────────────────────
  const lt = useRef<{ x: number; y: number } | null>(null);
  const lp = useRef<number | null>(null);
  const onTS = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.mmn')) return;
    if (e.touches.length === 1) { lt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; lp.current = null; }
    else if (e.touches.length === 2) {
      lt.current = null;
      lp.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  };
  const onTM = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lt.current) {
      const dx = e.touches[0].clientX - lt.current.x;
      const dy = e.touches[0].clientY - lt.current.y;
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
      lt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lp.current !== null) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setScale(s => Math.min(Math.max(s * (d / lp.current!), 0.15), 3));
      lp.current = d;
    }
  };
  const onTE = () => { lt.current = null; lp.current = null; };

  // ── Scroll zoom toward cursor ────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const ns = Math.min(Math.max(scale * (1 - e.deltaY * 0.001), 0.15), 3);
    const r  = ns / scale;
    setScale(ns);
    setPos(p => ({ x: mx - r * (mx - p.x), y: my - r * (my - p.y) }));
  };

  // ── Download ──────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!canvasRef.current || !nodes.length) return;
    try {
      const orig = canvasRef.current.style.transform;
      const P = 48;
      canvasRef.current.style.transform = `translate(${-(svgBox.x - P)}px,${-(svgBox.y - P)}px) scale(1)`;
      const url = await toPng(canvasRef.current, { backgroundColor: '#f8fafc', width: svgBox.w + P * 2, height: svgBox.h + P * 2, pixelRatio: 2 });
      canvasRef.current.style.transform = orig;
      Object.assign(document.createElement('a'), { href: url, download: `mindmap-${chapter.title}.png` }).click();
    } catch (err) { console.error(err); }
  };

  const selectedNode = nodes.find(n => n.id === selectedId) ?? null;

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIG SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (!mapData) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2">Generate Mind Map</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Choose your settings, then generate.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Detail */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Layers className="w-5 h-5" /></div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Detail Level</h3>
            </div>
            {(['BRIEF','STANDARD','DETAILED'] as DetailLevel[]).map(lv => (
              <button key={lv} onClick={() => setDetail(lv)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border mb-2 transition-all
                ${detail === lv ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{lv.toLowerCase()}</span>
                {detail === lv && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>

          {/* Complexity */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><BrainCircuit className="w-5 h-5" /></div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Complexity</h3>
            </div>
            {(['BASIC','INTERMEDIATE','ADVANCED'] as Complexity[]).map(cm => (
              <button key={cm} onClick={() => setComplexity(cm)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border mb-2 transition-all
                ${complexity === cm ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'}`}>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{cm.toLowerCase()}</span>
                {complexity === cm && <Check className="w-4 h-4 text-purple-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button onClick={handleGenerate} disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all">
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5" />Generate Map</>}
          </button>

          {history.length > 0 && (
            <div className="w-full max-w-lg">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent History</p>
              {history.map(h => (
                <button key={h.id} onClick={() => setMapData(h.data)}
                  className="w-full flex items-center gap-3 p-3 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-400 transition-colors text-left">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {new Date(h.timestamp).toLocaleDateString()} · {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400">{h.config.complexity} · {h.config.detail}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CANVAS SCREEN — full height, floating controls, bottom sheet for details
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Floating controls (top-right) ──────────────────────────────────── */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-1">
        <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} title="Zoom In"
          className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.15))} title="Zoom Out"
          className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => fitAll()} title="Fit view"
          className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-700 mx-1" />
        <button onClick={handleDownload} title="Download PNG"
          className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => { setMapData(null); setNodes([]); setEdges([]); setSelectedId(null); }} title="Reconfigure"
          className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Chapter label (top-left) ────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-30 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-xl shadow border border-slate-200 dark:border-slate-700 px-3 py-2 max-w-[55vw] pointer-events-none">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{chapter.title}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{complexity} · {detail}</p>
      </div>

      {/* ── Hint (bottom-center, only when nothing selected) ────────────────── */}
      {!selectedId && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-[10px] text-slate-400 dark:text-slate-600 bg-white/70 dark:bg-slate-900/70 backdrop-blur px-3 py-1 rounded-full">
            Pinch/scroll to zoom · drag to pan · tap node for details
          </p>
        </div>
      )}

      {/* ── Pan / zoom canvas ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}
        onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        onWheel={onWheel}
      >
        {/* Dot-grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <defs>
            <pattern id="mmgrid"
              x={(pos.x % (18 * scale)).toFixed(2)} y={(pos.y % (18 * scale)).toFixed(2)}
              width={(18 * scale).toFixed(2)} height={(18 * scale).toFixed(2)} patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#94a3b8" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mmgrid)" />
        </svg>

        {/* Transformed canvas */}
        <div
          ref={canvasRef}
          style={{ transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
          className="absolute top-0 left-0"
        >
          {/*
           * SVG EDGES
           * ─────────
           * The SVG is positioned at (svgBox.x, svgBox.y) in canvas space.
           * viewBox maps the SVG's internal coordinate system to match the
           * layout coordinate space (root at 0,0). This ensures bezier paths
           * drawn with layout coordinates render at the correct canvas positions.
           */}
          <svg
            viewBox={`${svgBox.x} ${svgBox.y} ${svgBox.w} ${svgBox.h}`}
            style={{
              position: 'absolute',
              left: svgBox.x,
              top:  svgBox.y,
              width:  svgBox.w,
              height: svgBox.h,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {edges.map(e => {
              const dy = e.y2 - e.y1;
              return (
                <path
                  key={e.id}
                  d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + dy * 0.5}, ${e.x2} ${e.y2 - dy * 0.5}, ${e.x2} ${e.y2}`}
                  fill="none" strokeWidth={2} strokeLinecap="round"
                  stroke="#94a3b8"
                  className="dark:stroke-slate-600"
                />
              );
            })}
          </svg>

          {/* NODES */}
          {nodes.map(node => {
            const isRoot = node.data.isRoot;
            const isSel  = selectedId === node.id;
            const ci     = Math.min(node.depth, DEPTH_BG.length - 1);
            const bg     = DEPTH_BG[ci];
            const ring   = DEPTH_RING[ci];

            return (
              <div
                key={node.id}
                className="mmn absolute flex items-center justify-center rounded-2xl cursor-pointer select-none"
                style={{
                  left:   node.x - node.width  / 2,
                  top:    node.y - node.height / 2,
                  width:  node.width,
                  height: node.height,
                  backgroundColor: bg,
                  border: `2.5px solid ${ring}`,
                  boxShadow: isSel
                    ? `0 0 0 4px ${bg}55, 0 8px 24px ${bg}66`
                    : '0 2px 8px rgba(0,0,0,0.18)',
                  transform: isSel ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  zIndex: isSel ? 20 : 10,
                }}
                onClick={e => { e.stopPropagation(); setSelectedId(p => p === node.id ? null : node.id); }}
              >
                <p
                  className="text-white font-semibold text-center leading-tight px-3"
                  style={{
                    fontSize: isRoot ? 13 : 11,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {node.data.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom-sheet: node detail ────────────────────────────────────────── */}
      {selectedNode && !selectedNode.data.isRoot && (
        <div
          className="absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-250"
          style={{ maxHeight: '45%' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          {/* Header */}
          <div className="flex items-start justify-between px-4 pb-2">
            <div className="min-w-0 pr-3">
              {selectedNode.data.type && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 mb-1">
                  {selectedNode.data.type}
                </span>
              )}
              <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 text-base leading-snug">
                {selectedNode.data.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 mt-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Content */}
          <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(45vh - 80px)' }}>
            <MarkdownRenderer
              content={selectedNode.data.description || 'No description available.'}
              className="text-sm text-slate-600 dark:text-slate-300"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMap;
