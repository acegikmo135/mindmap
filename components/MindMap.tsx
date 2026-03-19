import React, { useRef, useState, useEffect } from 'react';
import { Chapter, Concept, MindMapData } from '../types';
import { ZoomIn, ZoomOut, Maximize2, Settings2, Sparkles, Layers, BrainCircuit, Check, Loader2, Download, History, Clock } from 'lucide-react';
import { generateMindMapData } from '../services/geminiService';
import { toPng } from 'html-to-image';
import { useAuth } from '../contexts/AuthContext';
import { saveMindMap, getMindMaps } from '../services/db';

interface MindMapProps {
  chapter: Chapter;
}

interface TreeNode {
  id: string;
  data: { title: string; description: string; isRoot: boolean; [key: string]: any };
  x: number;
  y: number;
  width: number;
  height: number;
  children: TreeNode[];
  parentId?: string;
  depth: number;
}

// Configuration Types
type Complexity = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
type DetailLevel = 'BRIEF' | 'STANDARD' | 'DETAILED';

const NODE_WIDTH = 260; 
const NODE_HEIGHT = 80;
const VERTICAL_GAP = 120; // Space between levels
const HORIZONTAL_GAP = 80; // Space between siblings

const MindMap: React.FC<MindMapProps> = ({ chapter }) => {
  const { user } = useAuth();
  // Config State
  const [config, setConfig] = useState<{ complexity: Complexity; detail: DetailLevel } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMapData, setGeneratedMapData] = useState<{ rootTitle: string; nodes: any[] } | null>(null);
  
  // History State
  const [history, setHistory] = useState<MindMapData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Map State
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [edges, setEdges] = useState<{ x1: number, y1: number, x2: number, y2: number, id: string }[]>([]);
  
  // Viewport State
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Load History
  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const maps = await getMindMaps(user.id, chapter.id);
      setHistory(maps);
    };
    loadHistory();
  }, [user, chapter.id]);

  // --- Generate Handler ---
  const handleGenerate = async () => {
    if (!config) return;
    setIsLoading(true);
    const data = await generateMindMapData(chapter.title, config.complexity, config.detail);
    if (data && user) {
        setGeneratedMapData(data);
        
        // Save to history
        const newMap: MindMapData = {
          id: Date.now().toString(),
          chapterId: chapter.id,
          timestamp: Date.now(),
          config: { complexity: config.complexity, detail: config.detail },
          data: data
        };
        
        await saveMindMap(user.id, chapter.id, newMap);
        setHistory(prev => [newMap, ...prev].slice(0, 5));

        // Reset view and selection
        setSelectedNodeId(null);
        if (containerRef.current) {
            setPosition({ x: containerRef.current.clientWidth / 2, y: 100 });
        }
    }
    setIsLoading(false);
  };

  const handleLoadHistory = (map: MindMapData) => {
    setGeneratedMapData(map.data);
    setConfig({ complexity: map.config.complexity as Complexity, detail: map.config.detail as DetailLevel });
    setShowHistory(false);
    setSelectedNodeId(null);
    if (containerRef.current) {
        setPosition({ x: containerRef.current.clientWidth / 2, y: 100 });
    }
  };

  const handleDownload = async () => {
    if (mapContentRef.current && nodes.length > 0) {
      try {
        // Calculate bounding box of all nodes
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        nodes.forEach(node => {
          // node.x and node.y are the center of the node
          const left = node.x - node.width / 2;
          const right = node.x + node.width / 2;
          const top = node.y - node.height / 2;
          const bottom = node.y + node.height / 2;

          if (left < minX) minX = left;
          if (right > maxX) maxX = right;
          if (top < minY) minY = top;
          if (bottom > maxY) maxY = bottom;
        });

        // Add padding
        const padding = 40;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // Temporarily adjust the style of the content to fit exactly
        const originalTransform = mapContentRef.current.style.transform;
        const originalWidth = mapContentRef.current.style.width;
        const originalHeight = mapContentRef.current.style.height;

        // Reset transform and set explicit dimensions for capture
        // We translate so that the top-left of the bounding box is at (padding, padding)
        mapContentRef.current.style.transform = `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`;
        mapContentRef.current.style.width = `${width}px`;
        mapContentRef.current.style.height = `${height}px`;

        const dataUrl = await toPng(mapContentRef.current, {
          backgroundColor: '#ffffff',
          width: width,
          height: height,
          pixelRatio: 2, // High resolution
          style: {
            transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`,
          }
        });

        // Restore original styles
        mapContentRef.current.style.transform = originalTransform;
        mapContentRef.current.style.width = originalWidth;
        mapContentRef.current.style.height = originalHeight;

        const link = document.createElement('a');
        link.download = `mindmap-${chapter.title}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to download image', err);
      }
    }
  };

  // --- Layout Algorithm ---
  useEffect(() => {
    if (!generatedMapData) return;

    // 1. Convert Data to Tree Structure
    // Helper to determine dimensions based on selection state and content
    const getNodeDimensions = (id: string, isRoot: boolean, title: string, description: string) => {
        const isSelected = id === selectedNodeId;
        
        // Base width
        const width = NODE_WIDTH;
        
        if (isRoot) {
          return { width: 280, height: 100 };
        }

        if (!isSelected) {
          return { width, height: NODE_HEIGHT };
        }

        // Calculate height based on content for expanded node
        // Rough estimation: 20px per line (approx 40 chars per line at 14px font)
        const charCount = description.length + title.length;
        const estimatedLines = Math.ceil(charCount / 35);
        const contentHeight = Math.max(160, estimatedLines * 22 + 100); // min 160, plus padding/header
        
        return { width, height: contentHeight };
    };

    const rootNode: TreeNode = {
      id: 'root',
      data: { title: generatedMapData.rootTitle, description: "Main Topic", isRoot: true },
      x: 0,
      y: 0,
      width: 280, 
      height: 100,
      children: [],
      depth: 0
    };

    const nodeMap = new Map<string, TreeNode>();
    
    // Create nodes
    generatedMapData.nodes.forEach(n => {
      const dims = getNodeDimensions(n.id, false, n.title, n.description);
      nodeMap.set(n.id, {
        id: n.id,
        data: { ...n, isRoot: false },
        x: 0, 
        y: 0,
        width: dims.width,
        height: dims.height,
        children: [],
        depth: 0
      });
    });

    // Build hierarchy
    generatedMapData.nodes.forEach(n => {
      const node = nodeMap.get(n.id)!;
      const pid = n.parentId;
      
      if (!pid || pid === 'root') {
          rootNode.children.push(node);
          node.parentId = 'root';
      } else {
          const parent = nodeMap.get(pid);
          if (parent) {
              parent.children.push(node);
              node.parentId = pid;
          } else {
              rootNode.children.push(node);
              node.parentId = 'root';
          }
      }
    });

    // 2. Recursive Position Calculation
    // Calculate required width for each subtree to prevent overlap
    const calculateSubtreeWidth = (node: TreeNode, depth: number): number => {
      node.depth = depth;
      if (node.children.length === 0) return node.width;
      
      const childrenWidth = node.children.reduce((acc, child) => acc + calculateSubtreeWidth(child, depth + 1), 0);
      const gaps = (node.children.length - 1) * HORIZONTAL_GAP;
      return Math.max(node.width, childrenWidth + gaps);
    };

    // Assign X and Y coordinates
    const assignPositions = (node: TreeNode, x: number, y: number) => {
      node.x = x;
      node.y = y;

      if (node.children.length > 0) {
        // Recalculate widths locally for specific placement logic
        const getStoredWidth = (n: TreeNode) => {
            if (n.children.length === 0) return n.width;
            const w = n.children.reduce((acc, c) => acc + getStoredWidth(c), 0) + (n.children.length - 1) * HORIZONTAL_GAP;
            return Math.max(n.width, w);
        };
        
        const childWidths = node.children.map(getStoredWidth);
        const totalChildrenWidth = childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * HORIZONTAL_GAP;
        
        let currentX = x - totalChildrenWidth / 2;
        
        node.children.forEach((child, i) => {
          const w = childWidths[i];
          const childX = currentX + w / 2;
          
          // CRITICAL CHANGE: Calculate child Y based on Parent's Bottom edge + GAP + Child's Top edge
          // Node position is centered (x,y).
          // Parent Bottom = y + node.height/2
          // Child Top = childY - child.height/2
          // We want: Child Top = Parent Bottom + VERTICAL_GAP
          // childY - child.height/2 = y + node.height/2 + VERTICAL_GAP
          // childY = y + node.height/2 + VERTICAL_GAP + child.height/2
          
          const childY = y + (node.height / 2) + VERTICAL_GAP + (child.height / 2);
          
          assignPositions(child, childX, childY);
          currentX += w + HORIZONTAL_GAP;
        });
      }
    };

    calculateSubtreeWidth(rootNode, 0);
    // Start layout. Note: rootNode.height is already set dynamic based on selection
    assignPositions(rootNode, 0, 0);

    // 3. Flatten for Rendering
    const flattenedNodes: TreeNode[] = [];
    const flattenedEdges: { x1: number, y1: number, x2: number, y2: number, id: string }[] = [];

    const traverse = (node: TreeNode) => {
      flattenedNodes.push(node);
      node.children.forEach(child => {
        flattenedEdges.push({
          id: `${node.id}-${child.id}`,
          x1: node.x,
          y1: node.y + node.height / 2, // Start from bottom center
          x2: child.x,
          y2: child.y - child.height / 2 // End at top center
        });
        traverse(child);
      });
    };

    traverse(rootNode);
    setNodes(flattenedNodes);
    setEdges(flattenedEdges);
    
    // Initial centering only if no position set (or could strictly enforce on generate)
    // We handle that in handleGenerate
    
  }, [generatedMapData, selectedNodeId]); // Re-run when selection changes to push nodes


  // --- Event Handlers ---

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 1 - e.deltaY * 0.001;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);
    setScale(newScale);
  };

  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-node')) return;
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      setLastTouchDistance(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setLastTouchDistance(getTouchDistance(e.touches));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && lastTouchDistance !== null) {
      const distance = getTouchDistance(e.touches);
      const delta = distance - lastTouchDistance;
      const zoomFactor = 1 + delta * 0.01;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.1), 5);
      setScale(newScale);
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastTouchDistance(null);
  };
  
  const handleNodeClick = (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
      e.stopPropagation();
      setSelectedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  // --- Configuration Screen Render ---
  if (!config || !generatedMapData) {
    return (
      <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-white mb-4">
             Generate Mind Map
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm md:text-base">
             Customize how you want to visualize the connections in this chapter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
           {/* Detail Level */}
           <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                    <Layers className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                 <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Detail Level</h3>
              </div>
              <div className="space-y-2 md:space-y-3">
                 {(['BRIEF', 'STANDARD', 'DETAILED'] as DetailLevel[]).map(level => (
                    <button
                        key={level}
                        onClick={() => setConfig(prev => ({ complexity: prev?.complexity || 'INTERMEDIATE', detail: level }))}
                        className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all group
                        ${config?.detail === level 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}
                    >
                        <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-sm md:text-base">{level.toLowerCase()}</span>
                        {config?.detail === level && <Check className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />}
                    </button>
                 ))}
              </div>
           </div>

           {/* Complexity */}
           <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                 <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                    <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                 <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100">Complexity</h3>
              </div>
              <div className="space-y-2 md:space-y-3">
                 {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as Complexity[]).map(comp => (
                    <button
                        key={comp}
                        onClick={() => setConfig(prev => ({ detail: prev?.detail || 'STANDARD', complexity: comp }))}
                        className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl border transition-all group
                        ${config?.complexity === comp 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10'}`}
                    >
                         <span className="font-medium text-slate-700 dark:text-slate-300 capitalize text-sm md:text-base">{comp.toLowerCase()}</span>
                         {config?.complexity === comp && <Check className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-6">
            <button 
                onClick={handleGenerate}
                disabled={!config || isLoading}
                className={`w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all
                ${(!config || isLoading) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
            >
                {isLoading ? (
                    <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Structure...
                    </>
                ) : (
                    <>
                    <Sparkles className="w-5 h-5" />
                    Generate Map
                    </>
                )}
            </button>

            {history.length > 0 && (
              <div className="w-full max-w-2xl">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recent History</h3>
                <div className="grid gap-2">
                  {history.map(map => (
                    <button
                      key={map.id}
                      onClick={() => handleLoadHistory(map)}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                             {new Date(map.timestamp).toLocaleDateString()} • {new Date(map.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-slate-500">
                             {map.config.complexity} • {map.config.detail}
                          </p>
                        </div>
                      </div>
                      <History className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner select-none animate-in fade-in duration-700">
      
      {/* Controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-row md:flex-col gap-2 bg-white dark:bg-slate-800 p-1 md:p-2 rounded-lg shadow-md border border-slate-100 dark:border-slate-700">
        <button onClick={() => setScale(s => Math.min(s + 0.2, 2))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Zoom In">
          <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Zoom Out">
          <ZoomOut className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button onClick={() => { setScale(0.8); setPosition({ x: containerRef.current ? containerRef.current.clientWidth/2 : 0, y: 100 }); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Fit View">
          <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <div className="hidden md:block h-px bg-slate-200 dark:bg-slate-700 my-1" />
        <button 
            onClick={handleDownload}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" 
            title="Download as Image"
        >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <button 
            onClick={() => { setConfig(null); setGeneratedMapData(null); }} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" 
            title="Reconfigure"
        >
            <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="absolute top-4 left-4 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none max-w-[200px] md:max-w-none">
        <h2 className="font-serif font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base truncate">{chapter.title}</h2>
        <div className="flex items-center gap-3 mt-1 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Layers className="w-2.5 h-2.5 md:w-3 md:h-3"/> {config.detail}</span>
            <span className="flex items-center gap-1"><BrainCircuit className="w-2.5 h-2.5 md:w-3 md:h-3"/> {config.complexity}</span>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div 
          ref={mapContentRef}
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="w-full h-full"
        >
          {/* Edges Layer (SVG) */}
          <svg className="absolute top-0 left-0 overflow-visible pointer-events-none" style={{ width: 1, height: 1 }}>
            {edges.map((edge, i) => {
              // Create a nice bezier curve
              // vertical layout: start bottom, end top
              const dy = edge.y2 - edge.y1;
              const controlY1 = edge.y1 + dy * 0.4;
              const controlY2 = edge.y2 - dy * 0.4;
              
              return (
                <path
                  key={edge.id}
                  d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${controlY1}, ${edge.x2} ${controlY2}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke="#cbd5e1" // slate-300
                  strokeWidth="2"
                  className="dark:stroke-slate-700 transition-all duration-500 ease-in-out"
                />
              );
            })}
          </svg>

          {/* Nodes Layer (HTML) */}
          {nodes.map((node, index) => {
             const isRoot = node.data.isRoot;
             const isSelected = selectedNodeId === node.id;
             const concept = node.data;
             
             // Staggered animation delay based on depth/index only on mount
             const animationDelay = `${index * 50}ms`;

             return (
              <div
                key={node.id}
                onClick={(e) => handleNodeClick(e, node.id)}
                className={`
                  mindmap-node absolute flex flex-col items-center justify-start rounded-2xl shadow-sm border-2 cursor-pointer
                  transition-all duration-500 ease-in-out
                  ${isRoot 
                    ? 'bg-primary-600 border-primary-700 text-white shadow-xl z-20' 
                    : isSelected
                      ? 'bg-white dark:bg-slate-800 border-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/40 z-50 shadow-2xl'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:scale-105 z-10'
                  }
                `}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height, // Use node.height from layout
                  marginLeft: -node.width / 2, // Centering
                  marginTop: -node.height / 2, // Centering vertically
                  padding: isSelected ? '1.5rem' : '1rem'
                }}
              >
                <div className="w-full flex flex-col items-center justify-center">
                    <h3 className={`font-serif font-bold leading-tight text-center w-full ${isRoot ? 'text-lg' : 'text-sm text-slate-800 dark:text-slate-100'}`}>
                        {concept.title}
                    </h3>
                    
                    {/* Collapsed View for non-root */}
                    {!isRoot && !isSelected && (
                        <div className="mt-2 w-8 h-1 bg-slate-100 dark:bg-slate-700 rounded-full group-hover:bg-primary-100 transition-colors" />
                    )}

                    {/* Expanded View with Animation */}
                    <div 
                        className={`
                            overflow-y-auto w-full mt-3 pt-3 border-t border-slate-100 dark:border-slate-700
                            transition-opacity duration-300 delay-100
                            ${!isRoot && isSelected ? 'opacity-100 visible flex-1' : 'opacity-0 invisible h-0'}
                        `}
                    >
                         {!isRoot && (
                            <div className="text-sm text-slate-600 dark:text-slate-300 text-left space-y-3">
                                <p className="leading-relaxed">{concept.description}</p>
                                
                                {concept.type && (
                                  <div className="inline-block px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                    {concept.type}
                                  </div>
                                )}
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs">
                                    <p className="font-semibold mb-1">Key Insight:</p>
                                    <p className="italic text-slate-500 dark:text-slate-400">
                                        Understanding this connects directly to the root topic.
                                    </p>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default MindMap;