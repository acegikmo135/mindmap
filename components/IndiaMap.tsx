import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Chapter } from '../types';
// @ts-ignore
import indiaRaw from '../india-states.json';

// ── Types ─────────────────────────────────────────────────────────────────────
type Region = 'North' | 'South' | 'East' | 'West' | 'Central' | 'NE' | 'UT';
interface StateInfo { id: string; geoName: string; name: string; capital: string; region: Region; facts: string[]; }
type Mode = 'explore' | 'quiz';
interface QuizState { targetId: string; answered: boolean; isCorrect: boolean; clickedId: string | null; score: number; total: number; streak: number; usedIds: string[]; }

// ── Region palette ────────────────────────────────────────────────────────────
const RC: Record<Region, { dot: string; fill: string; hover: string; darkFill: string; darkHover: string; stroke: string; bg: string; darkBg: string; text: string; label: string }> = {
  North:   { dot:'#b87e10', fill:'#fef9e7', hover:'#fde68a', darkFill:'rgba(196,144,32,0.22)',  darkHover:'rgba(196,144,32,0.42)', stroke:'#c49020', bg:'#fef3c7', darkBg:'rgba(196,144,32,0.18)', text:'#78400a', label:'North India'    },
  South:   { dot:'#2a9e6e', fill:'#e6faf2', hover:'#6ee7b7', darkFill:'rgba(42,158,110,0.22)', darkHover:'rgba(42,158,110,0.42)',  stroke:'#2a9e6e', bg:'#d4f5e8', darkBg:'rgba(42,158,110,0.18)', text:'#0e4030', label:'South India'    },
  East:    { dot:'#6d5db5', fill:'#eeebff', hover:'#c4b5fd', darkFill:'rgba(124,110,192,0.22)',darkHover:'rgba(124,110,192,0.42)', stroke:'#7c6ec0', bg:'#ede8fb', darkBg:'rgba(124,110,192,0.18)',text:'#342860', label:'East India'     },
  West:    { dot:'#c85b32', fill:'#fff1ec', hover:'#fdba74', darkFill:'rgba(200,91,50,0.22)',  darkHover:'rgba(200,91,50,0.42)',   stroke:'#c85b32', bg:'#fde8de', darkBg:'rgba(200,91,50,0.18)', text:'#6b2d14', label:'West India'     },
  Central: { dot:'#a83878', fill:'#fdf0f8', hover:'#f9a8d4', darkFill:'rgba(184,78,136,0.22)',darkHover:'rgba(184,78,136,0.42)',  stroke:'#b84e88', bg:'#fde4f0', darkBg:'rgba(184,78,136,0.18)',text:'#5c1840', label:'Central India'  },
  NE:      { dot:'#2068be', fill:'#eff6ff', hover:'#93c5fd', darkFill:'rgba(46,125,209,0.22)', darkHover:'rgba(46,125,209,0.42)', stroke:'#2e7dd1', bg:'#dbeafe', darkBg:'rgba(46,125,209,0.18)', text:'#1e3a6e', label:'North-East'     },
  UT:      { dot:'#64748b', fill:'#f8fafc', hover:'#cbd5e1', darkFill:'rgba(100,116,139,0.22)',darkHover:'rgba(100,116,139,0.42)',stroke:'#94a3b8', bg:'#f1f5f9', darkBg:'rgba(100,116,139,0.18)',text:'#334155', label:'Union Territory' },
};

// ── State metadata ────────────────────────────────────────────────────────────
const STATES: StateInfo[] = [
  { id:'jk', geoName:'Jammu and Kashmir',  name:'Jammu & Kashmir',   capital:'Srinagar (Summer) · Jammu (Winter)', region:'North',   facts:['Has two seasonal capitals.','Famous for Dal Lake and the Mughal Gardens.','Jhelum river flows through the Kashmir valley.'] },
  { id:'la', geoName:'Ladakh',             name:'Ladakh',            capital:'Leh',                                region:'North',   facts:['Highest altitude Union Territory in India.','Shares borders with both Pakistan and China.','Pangong Tso lake sits at 4,350 m altitude.'] },
  { id:'hp', geoName:'Himachal Pradesh',   name:'Himachal Pradesh',  capital:'Shimla',                             region:'North',   facts:['Known as the "Apple State" of India.','Shimla was the summer capital of British India.','Rohtang Pass connects HP to the Lahaul-Spiti valley.'] },
  { id:'pb', geoName:'Punjab',             name:'Punjab',            capital:'Chandigarh',                         region:'North',   facts:['"Punjab" means Land of Five Rivers.','The Golden Temple is the holiest Sikh shrine.','Called the "Granary of India".'] },
  { id:'hr', geoName:'Haryana',            name:'Haryana',           capital:'Chandigarh',                         region:'North',   facts:['Shares capital Chandigarh with Punjab.','Kurukshetra is the Mahabharata battlefield.','Contains Gurugram, a major IT hub.'] },
  { id:'uk', geoName:'Uttarakhand',        name:'Uttarakhand',       capital:'Dehradun',                           region:'North',   facts:['Called "Dev Bhoomi" (Land of Gods).','Jim Corbett — India\'s first national park.','Char Dham pilgrimage circuit is here.'] },
  { id:'up', geoName:'Uttar Pradesh',      name:'Uttar Pradesh',     capital:'Lucknow',                            region:'North',   facts:['Most populous state (~240 million people).','Taj Mahal in Agra; Varanasi is one of the world\'s oldest cities.','Ganga and Yamuna flow through it.'] },
  { id:'dl', geoName:'Delhi',              name:'Delhi',             capital:'New Delhi',                          region:'UT',      facts:['National Capital Territory of India.','India Gate, Red Fort, and Qutb Minar.','One of Asia\'s largest metro systems.'] },
  { id:'ch', geoName:'Chandigarh',         name:'Chandigarh',        capital:'Chandigarh',                         region:'UT',      facts:['Capital of both Punjab and Haryana.','Designed by architect Le Corbusier.','One of India\'s most planned cities.'] },
  { id:'rj', geoName:'Rajasthan',          name:'Rajasthan',         capital:'Jaipur',                             region:'West',    facts:['Largest state by area.','Home to the Thar Desert.','Jaipur — "Pink City" — is a UNESCO Heritage City.'] },
  { id:'gj', geoName:'Gujarat',            name:'Gujarat',           capital:'Gandhinagar',                        region:'West',    facts:['Birthplace of Mahatma Gandhi.','Gir Forest — last home of Asiatic lions.','India\'s longest coastline — 1,600 km.'] },
  { id:'mp', geoName:'Madhya Pradesh',     name:'Madhya Pradesh',    capital:'Bhopal',                             region:'Central', facts:['Known as the "Heart of India".','Most tiger reserves (6) of any state.','Khajuraho and Sanchi are UNESCO sites.'] },
  { id:'cg', geoName:'Chhattisgarh',      name:'Chhattisgarh',      capital:'Raipur',                             region:'Central', facts:['Carved out of Madhya Pradesh in 2000.','Rich in coal, iron ore, and bauxite.','Chitrakot Falls is the "Niagara of India".'] },
  { id:'mh', geoName:'Maharashtra',        name:'Maharashtra',       capital:'Mumbai',                             region:'West',    facts:['Highest GDP state in India.','Mumbai hosts Bollywood and the oldest stock exchange in Asia.','Ajanta & Ellora Caves are UNESCO sites.'] },
  { id:'ga', geoName:'Goa',               name:'Goa',               capital:'Panaji',                             region:'West',    facts:['Smallest state by area.','Famous for beaches and Portuguese colonial heritage.','Highest per-capita income of any state.'] },
  { id:'br', geoName:'Bihar',             name:'Bihar',             capital:'Patna',                              region:'East',    facts:['Bodh Gaya — where Buddha attained enlightenment.','Nalanda was one of the world\'s first universities.','Patna is ancient Pataliputra, Maurya capital.'] },
  { id:'jh', geoName:'Jharkhand',          name:'Jharkhand',         capital:'Ranchi',                             region:'East',    facts:['Name means "Forest Region".','Richest state in mineral resources.','Home to 32 scheduled tribes.'] },
  { id:'wb', geoName:'West Bengal',        name:'West Bengal',       capital:'Kolkata',                            region:'East',    facts:['Kolkata was British India\'s capital until 1911.','Rabindranath Tagore — Asia\'s first Nobel laureate.','Sundarbans is the world\'s largest tidal forest.'] },
  { id:'or', geoName:'Odisha',             name:'Odisha',            capital:'Bhubaneswar',                        region:'East',    facts:['Konark Sun Temple is a UNESCO World Heritage Site.','Chilika Lake is Asia\'s largest brackish lagoon.','Puri Jagannath is one of the four Char Dhams.'] },
  { id:'sk', geoName:'Sikkim',             name:'Sikkim',            capital:'Gangtok',                            region:'NE',      facts:['Smallest state by area after Goa.','Kangchenjunga — world\'s 3rd highest peak.','First fully organic state in India.'] },
  { id:'as', geoName:'Assam',              name:'Assam',             capital:'Dispur',                             region:'NE',      facts:['Produces ~50% of India\'s tea.','Kaziranga has 2/3 of world\'s one-horned rhinos.','Brahmaputra river flows through it.'] },
  { id:'ar', geoName:'Arunachal Pradesh',  name:'Arunachal Pradesh', capital:'Itanagar',                           region:'NE',      facts:['Largest state in North-East India.','Called "Land of the Rising Sun".','Tawang Monastery is the largest in India.'] },
  { id:'nl', geoName:'Nagaland',           name:'Nagaland',          capital:'Kohima',                             region:'NE',      facts:['Famous for the Hornbill Festival.','Battle of Kohima (1944) was a WWII turning point.','Has 16 major Naga tribes.'] },
  { id:'mn', geoName:'Manipur',            name:'Manipur',           capital:'Imphal',                             region:'NE',      facts:['Called the "Jewel of India".','Loktak Lake has floating Phumdis islands.','Polo is said to have been invented here.'] },
  { id:'mz', geoName:'Mizoram',            name:'Mizoram',           capital:'Aizawl',                             region:'NE',      facts:['2nd highest literacy rate in India.','Famous for Anthurium flowers.','Name means "Land of the Hill Peoples".'] },
  { id:'tr', geoName:'Tripura',            name:'Tripura',           capital:'Agartala',                           region:'NE',      facts:['96% surrounded by Bangladesh.','Neermahal — a palace built on a lake.','The Tripuri kingdom dates back 1,300 years.'] },
  { id:'ml', geoName:'Meghalaya',          name:'Meghalaya',         capital:'Shillong',                           region:'NE',      facts:['Name means "Abode of Clouds".','Cherrapunji is among the world\'s wettest places.','Famous for living root bridges.'] },
  { id:'ka', geoName:'Karnataka',          name:'Karnataka',         capital:'Bengaluru',                          region:'South',   facts:['Bengaluru is India\'s Silicon Valley.','Hampi was capital of the Vijayanagara Empire.','Has most IT companies of any state.'] },
  { id:'ap', geoName:'Andhra Pradesh',     name:'Andhra Pradesh',    capital:'Amaravati',                          region:'South',   facts:['Tirupati Balaji — one of the world\'s richest temples.','Famous for Kuchipudi classical dance.','Longest coastline in peninsular India.'] },
  { id:'tg', geoName:'Telangana',          name:'Telangana',         capital:'Hyderabad',                          region:'South',   facts:['Youngest state in India (formed 2014).','Hyderabad known for Biryani, Charminar, and IT.','Nagarjunasagar is one of the world\'s largest dams.'] },
  { id:'tn', geoName:'Tamil Nadu',         name:'Tamil Nadu',        capital:'Chennai',                            region:'South',   facts:['Most temple complexes of any state.','Bharatanatyam dance originated here.','Ooty and Kodaikanal are iconic hill stations.'] },
  { id:'kl', geoName:'Kerala',             name:'Kerala',            capital:'Thiruvananthapuram',                 region:'South',   facts:['Highest Human Development Index in India.','Famous for backwaters, houseboats, and Kathakali.','First state to achieve near-100% literacy.'] },
  { id:'py', geoName:'Puducherry',         name:'Puducherry',        capital:'Puducherry',                         region:'UT',      facts:['Former French colony with charming French Quarter.','Sri Aurobindo Ashram and Auroville are here.','One of India\'s smallest Union Territories.'] },
];

const GEO_MAP = new Map(STATES.map(s => [s.geoName, s]));
const ID_MAP  = new Map(STATES.map(s => [s.id, s]));

// States to skip from main interactive SVG (islands / tiny enclaves)
const NON_INTERACTIVE = new Set(['Andaman and Nicobar Islands', 'Lakshadweep', 'Dadra and Nagar Haveli', 'Daman and Diu']);

// ── Projection (WGS84 → SVG 800×900) ─────────────────────────────────────────
// India bounding box: lon [68, 97.5], lat [8, 37.5]
const L0 = 68, L1 = 97.5, A0 = 8, A1 = 37.5, VW = 800, VH = 900;
const px = (lon: number) => ((lon - L0) / (L1 - L0)) * VW;
const py = (lat: number) => ((A1 - lat) / (A1 - A0)) * VH;

function ringToD(ring: number[][], skip = 1.2): string {
  const pts: string[] = [];
  let lx = Infinity, ly = Infinity;
  for (let i = 0; i < ring.length; i++) {
    const x = px(ring[i][0]), y = py(ring[i][1]);
    const dx = x - lx, dy = y - ly;
    if (i === 0 || dx * dx + dy * dy > skip * skip) {
      pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
      lx = x; ly = y;
    }
  }
  return pts.join('') + 'Z';
}

function geomToD(geom: any): string {
  if (geom.type === 'Polygon')
    return geom.coordinates.map((r: number[][]) => ringToD(r)).join('');
  if (geom.type === 'MultiPolygon')
    return (geom.coordinates as number[][][][])
      .map(poly => poly.map(r => ringToD(r)).join('')).join('');
  return '';
}

function centroidOf(geom: any): [number, number] {
  let ring: number[][];
  if (geom.type === 'Polygon') ring = geom.coordinates[0];
  else ring = (geom.coordinates as number[][][][]).reduce((a, b) => a[0].length >= b[0].length ? a : b)[0];
  let sx = 0, sy = 0;
  for (const p of ring) { sx += px(p[0]); sy += py(p[1]); }
  return [sx / ring.length, sy / ring.length];
}

// ── Pre-compute all features once ─────────────────────────────────────────────
interface Feat { geoName: string; state: StateInfo | null; d: string; cx: number; cy: number; interactive: boolean; }

const FEATS: Feat[] = (indiaRaw as any).features.map((f: any): Feat => {
  const geoName: string = f.properties.st_nm;
  const state = GEO_MAP.get(geoName) ?? null;
  const [cx, cy] = centroidOf(f.geometry);
  return { geoName, state, d: geomToD(f.geometry), cx, cy, interactive: !NON_INTERACTIVE.has(geoName) };
}).filter((f: Feat) => f.d.length > 2);

// Quiz uses only interactive states
const QUIZ_STATES = STATES.filter(s => !NON_INTERACTIVE.has(s.geoName));

// ── Component ─────────────────────────────────────────────────────────────────
const IndiaMap: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const [mode,       setMode]       = useState<Mode>('explore');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [quiz,       setQuiz]       = useState<QuizState | null>(null);
  const [isDark,     setIsDark]     = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // ── Quiz helpers ────────────────────────────────────────────────────────────
  const pickTarget = useCallback((used: string[]) => {
    const pool = QUIZ_STATES.filter(s => !used.includes(s.id));
    const from = pool.length > 0 ? pool : QUIZ_STATES;
    return from[Math.floor(Math.random() * from.length)].id;
  }, []);

  const startQuiz = useCallback(() => {
    setSelectedId(null);
    const tid = pickTarget([]);
    setQuiz({ targetId: tid, answered: false, isCorrect: false, clickedId: null, score: 0, total: 0, streak: 0, usedIds: [tid] });
    setMode('quiz');
  }, [pickTarget]);

  const nextQuestion = useCallback(() => {
    setQuiz(q => {
      if (!q) return null;
      const tid = pickTarget(q.usedIds);
      return { ...q, targetId: tid, answered: false, isCorrect: false, clickedId: null, usedIds: [...q.usedIds, tid] };
    });
  }, [pickTarget]);

  const handlePathClick = useCallback((feat: Feat) => {
    if (!feat.interactive || !feat.state) return;
    if (mode === 'explore') { setSelectedId(p => p === feat.state!.id ? null : feat.state!.id); return; }
    if (!quiz || quiz.answered) return;
    const ok = feat.state.id === quiz.targetId;
    setQuiz(q => q ? { ...q, answered: true, isCorrect: ok, clickedId: feat.state!.id, score: ok ? q.score + 1 : q.score, total: q.total + 1, streak: ok ? q.streak + 1 : 0 } : null);
  }, [mode, quiz]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedState = useMemo(() => selectedId ? ID_MAP.get(selectedId) : undefined, [selectedId]);
  const targetState   = useMemo(() => quiz ? ID_MAP.get(quiz.targetId) : undefined, [quiz]);
  const accuracy      = quiz && quiz.total > 0 ? Math.round(quiz.score / quiz.total * 100) : null;
  const accColor      = accuracy == null ? '#c85b32' : accuracy >= 75 ? '#22c55e' : accuracy >= 50 ? '#f59e0b' : '#ef4444';

  // ── Per-feature style ───────────────────────────────────────────────────────
  const featStyle = useCallback((feat: Feat): { fill: string; stroke: string; sw: number } => {
    if (!feat.interactive || !feat.state) {
      return { fill: isDark ? '#1e293b' : '#dde3f0', stroke: isDark ? '#334155' : '#b0bdd8', sw: 0.4 };
    }
    const id = feat.state.id;
    const rc = RC[feat.state.region];

    if (mode === 'quiz' && quiz) {
      if (quiz.answered) {
        if (id === quiz.targetId) return { fill: '#22c55e', stroke: '#15803d', sw: 2 };
        if (id === quiz.clickedId) return { fill: '#ef4444', stroke: '#b91c1c', sw: 2 };
      }
      return { fill: isDark ? 'rgba(30,41,59,0.5)' : 'rgba(226,232,240,0.7)', stroke: isDark ? '#334155' : '#b0bdd8', sw: 0.4 };
    }

    if (id === selectedId) return { fill: isDark ? rc.darkHover : rc.hover, stroke: rc.dot, sw: 1.8 };
    if (id === hoveredId)  return { fill: isDark ? rc.darkHover : rc.hover, stroke: rc.dot, sw: 1 };
    return { fill: isDark ? rc.darkFill : rc.fill, stroke: isDark ? '#3d5068' : '#9eb3cc', sw: 0.5 };
  }, [mode, quiz, selectedId, hoveredId, isDark]);

  const regions = Object.entries(RC) as [Region, typeof RC[Region]][];

  return (
    <div className="max-w-6xl mx-auto pb-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="px-4 mb-4 pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{chapter.subject}</span>
        <h1 className="font-headline text-2xl md:text-4xl text-on-surface mt-1 mb-1">India — States &amp; Map</h1>
        <p className="text-secondary text-xs md:text-sm">Click any state to explore it, or test yourself with the Practice Quiz.</p>
      </div>

      {/* Mode toggle */}
      <div className="px-4 mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => { setMode('explore'); setQuiz(null); setSelectedId(null); }}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode==='explore'?'primary-gradient text-white shadow-glow':'bg-surface-container text-secondary hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[16px]">travel_explore</span>Explore
        </button>
        <button onClick={startQuiz}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${mode==='quiz'?'primary-gradient text-white shadow-glow':'bg-surface-container text-secondary hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-[16px]">quiz</span>Practice Quiz
        </button>

        {/* Hover label in explore mode */}
        {mode === 'explore' && hoveredId && (
          <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold animate-in fade-in duration-150"
            style={{ background: RC[ID_MAP.get(hoveredId)?.region ?? 'North'].bg, color: RC[ID_MAP.get(hoveredId)?.region ?? 'North'].text }}>
            <span className="w-2 h-2 rounded-full" style={{ background: RC[ID_MAP.get(hoveredId)?.region ?? 'North'].dot }} />
            {ID_MAP.get(hoveredId)?.name}
          </div>
        )}
      </div>

      {/* Quiz card */}
      {mode === 'quiz' && quiz && (
        <div className="px-4 mb-4">
          <div className="rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4"
            style={{
              background: quiz.answered ? (quiz.isCorrect ? (isDark?'rgba(34,197,94,0.12)':'#dcfce7') : (isDark?'rgba(239,68,68,0.12)':'#fee2e2')) : (isDark?'rgba(200,91,50,0.10)':'#fde8de'),
              border: `1.5px solid ${quiz.answered ? (quiz.isCorrect ? '#22c55e55' : '#ef444455') : '#c85b3244'}`,
            }}>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-0.5">
                {quiz.answered ? (quiz.isCorrect ? '✓ Correct!' : '✗ Incorrect — the highlighted state is correct') : 'Click this state on the map →'}
              </p>
              <p className="font-headline text-2xl md:text-3xl text-on-surface">{targetState?.name}</p>
              {!quiz.answered && targetState && (
                <p className="text-xs text-secondary mt-0.5">
                  Region: <span className="font-semibold" style={{color:RC[targetState.region].dot}}>{RC[targetState.region].label}</span>
                </p>
              )}
              {quiz.answered && <p className="text-xs text-secondary mt-1">Capital: <strong className="text-on-surface">{targetState?.capital}</strong></p>}
            </div>
            <div className="flex items-center gap-4 shrink-0 flex-wrap">
              <div className="text-center">
                <p className="font-headline text-2xl leading-none" style={{color:accColor}}>{quiz.total===0?'—':`${accuracy}%`}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-0.5">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="font-headline text-2xl leading-none text-on-surface">{quiz.score}/{quiz.total}</p>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wide mt-0.5">Score</p>
              </div>
              {quiz.streak >= 3 && (
                <div className="text-center">
                  <p className="font-headline text-2xl" style={{color:'#f59e0b'}}>🔥{quiz.streak}</p>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wide">Streak</p>
                </div>
              )}
              {quiz.answered && (
                <button onClick={nextQuestion}
                  className="flex items-center gap-1.5 px-4 py-2 primary-gradient text-white rounded-full text-sm font-bold shadow-glow active:scale-95 transition-all">
                  Next <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map + Info panel */}
      <div className={`px-4 grid gap-4 ${selectedState && mode==='explore' ? 'grid-cols-1 lg:grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>

        {/* SVG Map */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: isDark?'#0c1829':'#e8edf8', border:`1px solid ${isDark?'rgba(199,196,216,0.14)':'rgba(140,160,200,0.4)'}`, boxShadow:'0 4px 24px rgba(15,23,42,0.08)' }}>

          <svg viewBox="0 0 800 900" className="w-full" style={{ display:'block', maxHeight:580 }}>
            {/* Ocean background */}
            <rect width="800" height="900" fill={isDark?'#0c1829':'#cad8f0'}/>

            {/* State paths */}
            {FEATS.map(feat => {
              const { fill, stroke, sw } = featStyle(feat);
              return (
                <path
                  key={feat.geoName}
                  d={feat.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinejoin="round"
                  style={{ cursor: feat.interactive ? 'pointer' : 'default', transition: 'fill 0.18s' }}
                  onClick={() => handlePathClick(feat)}
                  onMouseEnter={() => feat.interactive && feat.state && setHoveredId(feat.state.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
              );
            })}

            {/* Small state markers (for tiny states hard to click) */}
            {mode === 'explore' && FEATS
              .filter(f => f.interactive && f.state && ['dl','ch','ga','sk','py'].includes(f.state.id))
              .map(f => {
                const rc = RC[f.state!.region];
                const isSel = f.state!.id === selectedId;
                return (
                  <circle key={`dot-${f.state!.id}`}
                    cx={f.cx} cy={f.cy} r={isSel ? 7 : 5}
                    fill={isSel ? rc.dot : rc.dot + 'cc'}
                    stroke="#fff" strokeWidth={1.5}
                    style={{ cursor:'pointer', transition:'r 0.15s' }}
                    onClick={() => handlePathClick(f)}
                    onMouseEnter={() => setHoveredId(f.state!.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}

            {/* Quiz correct/wrong markers */}
            {mode === 'quiz' && quiz?.answered && (() => {
              const correctFeat = FEATS.find(f => f.state?.id === quiz.targetId);
              if (!correctFeat) return null;
              return <text x={correctFeat.cx} y={correctFeat.cy + 4} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" style={{pointerEvents:'none'}}>✓</text>;
            })()}
          </svg>

          <p className="text-center text-[10px] text-secondary py-2">
            {mode==='explore' ? 'Click any state to explore · Hover to see name' : 'Click the correct state shown above'}
          </p>
        </div>

        {/* Info panel */}
        {selectedState && mode === 'explore' && (
          <div className="rounded-2xl overflow-hidden animate-in slide-in-from-right-4 duration-300"
            style={{ background: isDark ? RC[selectedState.region].darkBg : RC[selectedState.region].bg, border: `1.5px solid ${RC[selectedState.region].stroke}55`, alignSelf:'start' }}>
            <div className="px-5 py-4" style={{ background: RC[selectedState.region].dot }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{color:'rgba(255,255,255,0.7)'}}>
                    {RC[selectedState.region].label}
                  </p>
                  <h2 className="font-headline text-xl text-white leading-tight">{selectedState.name}</h2>
                </div>
                <button onClick={() => setSelectedId(null)} style={{color:'rgba(255,255,255,0.75)'}}>
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0" style={{color:RC[selectedState.region].dot, fontVariationSettings:"'FILL' 1"}}>location_city</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-0.5">Capital</p>
                  <p className="text-sm font-semibold text-on-surface leading-snug">{selectedState.capital}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] shrink-0" style={{color:RC[selectedState.region].dot, fontVariationSettings:"'FILL' 1"}}>
                  {selectedState.region === 'UT' ? 'flag' : 'maps_home_work'}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-0.5">Type</p>
                  <p className="text-sm font-semibold text-on-surface">{selectedState.region === 'UT' ? 'Union Territory' : 'State'}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Key Facts</p>
                <ul className="space-y-2">
                  {selectedState.facts.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{background:RC[selectedState.region].dot}}/>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={startQuiz}
                className="w-full py-2.5 primary-gradient text-white rounded-xl text-sm font-bold shadow-glow hover:shadow-glow-lg transition-all">
                Test yourself — Practice Quiz
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 mt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Region Legend</p>
        <div className="flex flex-wrap gap-2">
          {regions.map(([key, r]) => (
            <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: isDark ? r.darkBg : r.bg, color: isDark ? r.dot : r.text, border:`1px solid ${r.stroke}44` }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{background:r.dot}}/>
              {r.label}
            </div>
          ))}
        </div>
      </div>

      {/* Counts */}
      <div className="px-4 mt-4 flex flex-wrap gap-3">
        {[
          { label:'States', count:STATES.filter(s=>s.region!=='UT').length, icon:'maps_home_work' },
          { label:'UTs',    count:STATES.filter(s=>s.region==='UT').length,  icon:'flag'          },
          { label:'Total',  count:STATES.length,                              icon:'language'      },
        ].map(({label,count,icon}) => (
          <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background:isDark?'rgba(199,196,216,0.08)':'#f1f5f9', border:`1px solid ${isDark?'rgba(199,196,216,0.12)':'rgba(199,196,216,0.4)'}` }}>
            <span className="material-symbols-outlined text-[16px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
            <span className="font-headline text-lg text-on-surface leading-none">{count}</span>
            <span className="text-[11px] text-secondary font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndiaMap;
