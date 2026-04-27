import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Chapter } from '../types';

interface TimelineEvent {
  id: string;
  year: string;
  yearNum: number;   // for sorting
  title: string;
  description: string;
  details: string;
  era: 'ancient' | 'medieval' | 'colonial' | 'freedom' | 'modern';
  tags: string[];
  image?: string;    // emoji placeholder (no external URLs needed)
  imageCaption?: string;
}

// Colour map per era
const ERA_STYLE: Record<TimelineEvent['era'], { bg: string; border: string; text: string; dot: string; label: string }> = {
  ancient:  { bg: '#fef2d4', border: '#c49020', text: '#5a3c00', dot: '#c49020', label: 'Ancient India'    },
  medieval: { bg: '#ede8fb', border: '#7c6ec0', text: '#342860', dot: '#7c6ec0', label: 'Medieval India'   },
  colonial: { bg: '#fde4f0', border: '#b84e88', text: '#5c1840', dot: '#b84e88', label: 'Colonial Period'  },
  freedom:  { bg: '#fde8de', border: '#c85b32', text: '#6b2d14', dot: '#c85b32', label: 'Freedom Struggle' },
  modern:   { bg: '#d4f5e8', border: '#2a9e6e', text: '#0e4030', dot: '#2a9e6e', label: 'Modern India'     },
};

// Dark mode era colours
const ERA_STYLE_DARK: Record<TimelineEvent['era'], { bg: string; border: string; text: string; dot: string }> = {
  ancient:  { bg: 'rgba(196,144,32,0.16)', border: 'rgba(196,144,32,0.70)', text: '#e8cc80', dot: '#d4b040' },
  medieval: { bg: 'rgba(124,110,192,0.16)',border: 'rgba(124,110,192,0.70)',text: '#c4b4f0', dot: '#a898e8' },
  colonial: { bg: 'rgba(184,78,136,0.16)', border: 'rgba(184,78,136,0.70)', text: '#f0a4cc', dot: '#e070b0' },
  freedom:  { bg: 'rgba(200,91,50,0.16)',  border: 'rgba(200,91,50,0.70)',  text: '#f4bca4', dot: '#f0a07a' },
  modern:   { bg: 'rgba(42,158,110,0.16)', border: 'rgba(42,158,110,0.70)', text: '#90d4b4', dot: '#60c898' },
};

const EVENTS: TimelineEvent[] = [
  {
    id: 'e1', year: '3000 BCE', yearNum: -3000,
    title: 'Indus Valley Civilization',
    description: 'One of the world\'s earliest urban cultures emerged in the Indus-Saraswati region.',
    details: 'The Indus Valley Civilization (c. 3300–1300 BCE) was a Bronze Age civilization that flourished in the basins of the Indus River. Cities like Mohenjo-daro and Harappa had advanced urban planning, drainage systems, and standardized weights. The civilization traded with Mesopotamia and had a yet-undeciphered script.',
    era: 'ancient', tags: ['Bronze Age', 'Harappan', 'Urban Planning'],
    image: '🏛️', imageCaption: 'Ruins of Mohenjo-daro — a planned city with grid streets and public baths.',
  },
  {
    id: 'e2', year: '1500 BCE', yearNum: -1500,
    title: 'Vedic Age Begins',
    description: 'The Aryans settle in the Indian subcontinent; the Vedas are composed.',
    details: 'The Vedic period saw the composition of the four Vedas — Rigveda, Samaveda, Yajurveda, and Atharvaveda. Early Vedic society was pastoral and tribal. The later Vedic age saw the emergence of kingdoms, iron tools, and the caste system. Philosophy and ritual were codified in the Upanishads and Brahmanas.',
    era: 'ancient', tags: ['Vedas', 'Aryan', 'Sanskrit'],
    image: '📜', imageCaption: 'Page from an ancient Vedic manuscript.',
  },
  {
    id: 'e3', year: '321 BCE', yearNum: -321,
    title: 'Maurya Empire Founded',
    description: 'Chandragupta Maurya establishes the first empire to unify most of India.',
    details: 'Chandragupta Maurya, guided by Chanakya (Kautilya), overthrew the Nanda dynasty and founded the Maurya Empire. At its peak under Emperor Ashoka (273–232 BCE), the empire stretched from present-day Afghanistan to Bangladesh. Ashoka\'s adoption of Buddhism and his rock edicts promoting non-violence mark a turning point in Indian history.',
    era: 'ancient', tags: ['Chandragupta', 'Ashoka', 'Buddhism'],
    image: '🦁', imageCaption: 'Ashoka\'s Lion Capital — now the national emblem of India.',
  },
  {
    id: 'e4', year: '320 CE', yearNum: 320,
    title: 'Gupta Empire — Golden Age',
    description: 'Art, science, and mathematics flourish under the Gupta dynasty.',
    details: 'The Gupta period (c. 320–550 CE) is often called the Golden Age of India. Scholars like Aryabhata calculated π and proposed Earth\'s rotation. Kalidasa wrote timeless Sanskrit literature. Temple architecture, sculpture, and trade reached new heights. The concept of zero and the decimal system were standardized.',
    era: 'ancient', tags: ['Golden Age', 'Aryabhata', 'Sanskrit Literature'],
    image: '🔢', imageCaption: 'Aryabhata\'s astronomical and mathematical innovations.',
  },
  {
    id: 'e5', year: '1206 CE', yearNum: 1206,
    title: 'Delhi Sultanate Established',
    description: 'Qutb-ud-din Aibak founds the first Muslim sultanate of Delhi.',
    details: 'The Delhi Sultanate (1206–1526 CE) was a series of five dynasties: Mamluk, Khilji, Tughlaq, Sayyid, and Lodi. It brought new architectural styles (the Qutb Minar), Persian as an administrative language, and cultural synthesis. Alauddin Khilji repelled Mongol invasions and implemented market reforms.',
    era: 'medieval', tags: ['Sultanate', 'Qutb Minar', 'Persian Culture'],
    image: '🕌', imageCaption: 'The Qutb Minar, Delhi — begun by Qutb-ud-din Aibak in 1193.',
  },
  {
    id: 'e6', year: '1526 CE', yearNum: 1526,
    title: 'Mughal Empire Founded',
    description: 'Babur defeats Ibrahim Lodi at the First Battle of Panipat.',
    details: 'Babur\'s victory at Panipat (1526) established the Mughal Empire, which at its peak under Akbar, Jahangir, Shah Jahan, and Aurangzeb, controlled most of the Indian subcontinent. The Mughals built the Taj Mahal, Red Fort, and Fatehpur Sikri. Akbar\'s policy of religious tolerance and the Mansabdari system are notable achievements.',
    era: 'medieval', tags: ['Babur', 'Akbar', 'Taj Mahal', 'Mughal Architecture'],
    image: '🕍', imageCaption: 'The Taj Mahal — built by Shah Jahan (1632–1653).',
  },
  {
    id: 'e7', year: '1600 CE', yearNum: 1600,
    title: 'East India Company Arrives',
    description: 'British East India Company receives a royal charter and begins trading in India.',
    details: 'Queen Elizabeth I granted a royal charter to the East India Company on 31 December 1600. Starting as a trading enterprise, the Company gradually built military alliances and political influence. After the Battle of Plassey (1757), Robert Clive established British dominance in Bengal, marking the beginning of colonial rule.',
    era: 'colonial', tags: ['British', 'Trade', 'Charter'],
    image: '🚢', imageCaption: 'British trading ships arriving at the Surat port.',
  },
  {
    id: 'e8', year: '1857 CE', yearNum: 1857,
    title: 'First War of Independence',
    description: 'Indian soldiers and civilians rise against British rule in what the British call the "Sepoy Mutiny".',
    details: 'The uprising of 1857 began with Indian soldiers (sepoys) of the British East India Company. Triggered by the introduction of greased cartridges, it quickly spread across northern and central India. Leaders like Rani Lakshmibai of Jhansi, Bahadur Shah Zafar, and Tantia Tope became symbols of resistance. The revolt led to the end of the Company and direct Crown rule.',
    era: 'colonial', tags: ['Sepoys', 'Rani Lakshmibai', 'Crown Rule'],
    image: '⚔️', imageCaption: 'Rani Lakshmibai — one of the prominent leaders of the 1857 uprising.',
  },
  {
    id: 'e9', year: '1885 CE', yearNum: 1885,
    title: 'Indian National Congress Founded',
    description: 'The INC is established as the first organised political platform for Indians.',
    details: 'The Indian National Congress (INC) was founded on 28 December 1885 in Bombay by A.O. Hume, with Womesh Chandra Bonnerjee as its first president. Initially it sought constitutional reforms. Over decades it became the primary vehicle of the freedom movement, with leaders like Bal Gangadhar Tilak, Gopal Krishna Gokhale, Jawaharlal Nehru, and Mahatma Gandhi.',
    era: 'freedom', tags: ['INC', 'Congress', 'Political Movement'],
    image: '🏛️', imageCaption: 'First session of the Indian National Congress, Bombay, 1885.',
  },
  {
    id: 'e10', year: '1920 CE', yearNum: 1920,
    title: 'Non-Cooperation Movement',
    description: 'Gandhi launches the first mass civil disobedience movement against British rule.',
    details: 'The Non-Cooperation Movement (1920–22) called on Indians to withdraw from government services, schools, courts, and British goods. It also demanded the release of political prisoners and Swaraj within a year. The movement was suspended after the Chauri Chaura incident where a mob set fire to a police station. It mobilised millions and showed Gandhi\'s mass leadership.',
    era: 'freedom', tags: ['Gandhi', 'Non-Cooperation', 'Swaraj', 'Civil Disobedience'],
    image: '🧵', imageCaption: 'Gandhi at his spinning wheel — symbol of self-reliance and resistance.',
  },
  {
    id: 'e11', year: '1930 CE', yearNum: 1930,
    title: 'Salt March (Dandi March)',
    description: 'Gandhi leads a 240-mile march to Dandi to protest the British salt tax.',
    details: 'On 12 March 1930, Gandhi began the famous Dandi March with 78 selected followers. After 24 days, on 6 April 1930, he picked up a handful of salt at the Dandi beach, defying the British salt laws. This act of civil disobedience galvanised the nation and drew international attention. The Salt March became a turning point in the freedom movement.',
    era: 'freedom', tags: ['Salt March', 'Dandi', 'Civil Disobedience', 'Tax Protest'],
    image: '🧂', imageCaption: 'Gandhi picking salt at Dandi Beach, April 6, 1930.',
  },
  {
    id: 'e12', year: '1942 CE', yearNum: 1942,
    title: 'Quit India Movement',
    description: 'Gandhi gives the "Do or Die" call; the largest civil disobedience movement begins.',
    details: 'On 8 August 1942, at Gowalia Tank Maidan in Bombay, Gandhi demanded immediate independence with his "Quit India" speech. The British arrested him and all Congress leaders within hours. Despite the suppression, the movement demonstrated India\'s determination for independence. Netaji Subhas Chandra Bose simultaneously formed the Indian National Army (INA) to fight the British from abroad.',
    era: 'freedom', tags: ['Quit India', 'Do or Die', 'INA', 'Subhash Chandra Bose'],
    image: '🇮🇳', imageCaption: 'Gowalia Tank Maidan, Bombay — where Gandhi delivered the Quit India speech.',
  },
  {
    id: 'e13', year: '1947 CE', yearNum: 1947,
    title: 'Independence & Partition',
    description: 'India gains independence on 15 August 1947 but is partitioned into India and Pakistan.',
    details: 'At the stroke of midnight on 14–15 August 1947, India became independent. Jawaharlal Nehru delivered the iconic "Tryst with Destiny" speech in Parliament. However, the partition of British India into two nations — India and Pakistan — led to one of the largest mass migrations in history and widespread communal violence, displacing about 14–18 million people.',
    era: 'modern', tags: ['Independence', 'Partition', 'Nehru', 'Midnight Speech'],
    image: '🕛', imageCaption: 'Nehru hoisting the flag at Parliament on Independence Day, 1947.',
  },
  {
    id: 'e14', year: '1950 CE', yearNum: 1950,
    title: 'Republic of India & Constitution',
    description: 'India adopts its Constitution on 26 January 1950 and becomes a sovereign republic.',
    details: 'On 26 January 1950, the Constitution of India came into force, making India a sovereign, democratic, secular republic. Dr. B.R. Ambedkar chaired the drafting committee. The constitution — the longest written constitution of any sovereign nation — guarantees fundamental rights, directive principles, and a parliamentary system of government.',
    era: 'modern', tags: ['Constitution', 'Republic Day', 'Ambedkar', 'Democracy'],
    image: '📖', imageCaption: 'Dr. B.R. Ambedkar with the Constitution of India.',
  },
  {
    id: 'e15', year: '1969 CE', yearNum: 1969,
    title: 'ISRO Founded',
    description: 'India establishes the Indian Space Research Organisation, beginning its space journey.',
    details: 'ISRO was established on 15 August 1969 under Dr. Vikram Sarabhai\'s vision. India\'s space programme reached global milestones — Aryabhata satellite (1975), Chandrayaan-1 Moon mission (2008), Mangalyaan Mars Orbiter (2014), and Chandrayaan-3 soft landing on the Moon\'s south pole (2023). ISRO has made India a significant space power at a fraction of the cost of Western agencies.',
    era: 'modern', tags: ['ISRO', 'Space', 'Vikram Sarabhai', 'Science'],
    image: '🚀', imageCaption: 'India\'s Mars Orbiter Mission — the first interplanetary mission by any Asian nation.',
  },
];

// ── Era filter pills ──────────────────────────────────────────────────────────
const ERAS: Array<{ key: TimelineEvent['era'] | 'all'; label: string }> = [
  { key: 'all',      label: 'All Eras' },
  { key: 'ancient',  label: 'Ancient'  },
  { key: 'medieval', label: 'Medieval' },
  { key: 'colonial', label: 'Colonial' },
  { key: 'freedom',  label: 'Freedom'  },
  { key: 'modern',   label: 'Modern'   },
];

// ── Component ─────────────────────────────────────────────────────────────────
const Timeline: React.FC<{ chapter: Chapter }> = ({ chapter }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<TimelineEvent['era'] | 'all'>('all');
  const [imageModal, setImageModal] = useState<TimelineEvent | null>(null);
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  React.useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const filtered = EVENTS.filter(e => {
    if (filter !== 'all' && e.era !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const getStyle = (era: TimelineEvent['era']) =>
    isDark ? ERA_STYLE_DARK[era] : ERA_STYLE[era];

  return (
    <div className="max-w-3xl mx-auto pb-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="px-4 mb-5 pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{chapter.subject}</span>
        <h1 className="font-headline text-2xl md:text-4xl text-on-surface mt-1 mb-1 leading-tight">
          {chapter.title}
        </h1>
        <p className="text-secondary text-xs md:text-sm">India's history — from ancient civilizations to the space age.</p>
      </div>

      {/* ── Search + Filters ── */}
      <div className="px-4 mb-5 space-y-2.5">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-outline">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events or tags…"
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-surface-container-lowest text-on-surface placeholder:text-outline border border-outline-variant/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        {/* Era pills — horizontal scroll on mobile, wrap on desktop */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {ERAS.map(({ key, label }) => {
            const active = filter === key;
            const s = key !== 'all' ? getStyle(key) : null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all"
                style={active && s
                  ? { background: s.border, color: '#fff' }
                  : active
                  ? { background: 'var(--cs-os)', color: 'var(--cs-surface)' }
                  : { background: 'var(--cs-sc)', color: 'var(--cs-sec)' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <span className="material-symbols-outlined text-3xl text-outline mb-2">search_off</span>
          <p className="text-secondary text-sm mb-2">No events match your search.</p>
          <button onClick={() => { setSearch(''); setFilter('all'); }} className="text-primary font-semibold text-xs hover:underline">Clear filters</button>
        </div>
      )}

      {/* ── Timeline ── */}
      <div className="relative px-4">
        {/*
          Mobile:  left-aligned — thin line at left-2, dot at left-0, cards start at pl-7
          Desktop: centered   — line at left-1/2, alternating cards left/right
        */}
        <div
          className="absolute left-[22px] md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px"
          style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
        />

        <div className="space-y-4">
          {filtered.map((event, idx) => {
            const s      = getStyle(event.era);
            const isLeft = idx % 2 === 0;
            const isOpen = expandedId === event.id;

            return (
              <div
                key={event.id}
                className={`relative flex md:gap-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                {/* Dot — small on mobile, normal on desktop */}
                <div
                  className="absolute left-[15px] md:left-1/2 md:-translate-x-1/2 z-10 flex-shrink-0"
                  style={{ top: 14 }}
                >
                  <div
                    className="rounded-full border-2 transition-all duration-300"
                    style={{
                      width:  isOpen ? 18 : 14,
                      height: isOpen ? 18 : 14,
                      marginLeft: isOpen ? -2 : 0,
                      marginTop:  isOpen ? -2 : 0,
                      background: s.dot,
                      borderColor: isDark ? 'var(--cs-surface)' : '#fff',
                      boxShadow: isOpen ? `0 0 0 3px ${s.border}66` : `0 0 0 2px ${s.border}33`,
                    }}
                  />
                </div>

                {/* Card wrapper — full width on mobile, half on desktop */}
                <div
                  className={`w-full pl-8 md:pl-0 md:w-[calc(50%-20px)] ${
                    isLeft ? 'md:mr-auto md:pr-5' : 'md:ml-auto md:pl-5'
                  }`}
                >
                  <div
                    className="rounded-xl cursor-pointer select-none overflow-hidden"
                    style={{
                      background:  s.bg,
                      border:      `1.5px solid ${isOpen ? s.border : s.border + '44'}`,
                      boxShadow:   isOpen
                        ? `0 6px 24px ${s.dot}33, 0 1px 4px rgba(0,0,0,0.08)`
                        : '0 1px 4px rgba(0,0,0,0.06)',
                      transform:   isOpen ? 'translateY(-1px)' : 'none',
                      transition:  'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
                    }}
                    onClick={() => setExpandedId(isOpen ? null : event.id)}
                  >
                    {/* ── Card header ── */}
                    <div className="px-3 pt-3 pb-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                            style={{ background: s.dot + '20', color: s.dot }}
                          >
                            {event.year}
                          </span>
                          <span className="text-[9px] font-semibold uppercase tracking-wide truncate hidden sm:block" style={{ color: s.border }}>
                            {ERA_STYLE[event.era].label}
                          </span>
                        </div>
                        <span
                          className="material-symbols-outlined text-[16px] flex-shrink-0 transition-transform duration-300"
                          style={{ color: s.border, transform: isOpen ? 'rotate(180deg)' : 'none' }}
                        >
                          expand_more
                        </span>
                      </div>

                      <h3 className="font-bold text-sm md:text-base leading-snug" style={{ color: s.text }}>
                        {event.title}
                      </h3>
                      <p className="text-xs md:text-sm mt-0.5 leading-relaxed" style={{ color: s.text, opacity: 0.75 }}>
                        {event.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="px-3 pb-2.5 flex flex-wrap gap-1">
                      {event.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: s.dot + '16', color: s.dot }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/*
                      ── Morph expand animation ──
                      grid-template-rows: 0fr → 1fr smoothly animates height
                      without needing JS to measure it.
                    */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateRows: isOpen ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.36s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          className="px-3 pb-3"
                          style={{ borderTop: `1px solid ${s.border}30`, paddingTop: 10 }}
                        >
                          {/* Image button */}
                          {event.image && (
                            <button
                              className="w-full mb-3 rounded-lg flex items-center gap-3 px-3 py-2.5 text-left transition-opacity hover:opacity-80 active:opacity-70"
                              style={{ background: s.dot + '12', border: `1px solid ${s.border}33` }}
                              onClick={e => { e.stopPropagation(); setImageModal(event); }}
                            >
                              <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{event.image}</span>
                              <div className="min-w-0">
                                {event.imageCaption && (
                                  <p className="text-[11px] leading-snug truncate" style={{ color: s.text, opacity: 0.75 }}>
                                    {event.imageCaption}
                                  </p>
                                )}
                                <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: s.dot }}>
                                  Tap to enlarge →
                                </p>
                              </div>
                            </button>
                          )}

                          <p className="text-xs md:text-sm leading-relaxed" style={{ color: s.text, opacity: 0.88 }}>
                            {event.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Era stats — compact horizontal scroll on mobile ── */}
      <div className="mt-8 px-4">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar md:grid md:grid-cols-5">
          {(Object.entries(ERA_STYLE) as [TimelineEvent['era'], typeof ERA_STYLE[TimelineEvent['era']]][]).map(([era, st]) => {
            const count = EVENTS.filter(e => e.era === era).length;
            const ds    = isDark ? ERA_STYLE_DARK[era] : st;
            const active = filter === era;
            return (
              <button
                key={era}
                onClick={() => setFilter(active ? 'all' : era)}
                className="flex-shrink-0 flex items-center gap-2 md:flex-col md:gap-1 px-3 py-2 md:p-3 rounded-xl text-left md:text-center transition-all active:scale-95"
                style={{
                  background: active ? ds.border : ds.bg,
                  border: `1.5px solid ${ds.border}`,
                  color:  active ? '#fff' : ds.text,
                  minWidth: 110,
                }}
              >
                <span className="text-lg font-headline font-bold md:text-xl">{count}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide leading-tight">{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image modal — rendered via portal to escape stacking context */}
      {imageModal && createPortal(
        <div
          className="animate-in fade-in duration-200"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={() => setImageModal(null)}
        >
          <div
            className="animate-in zoom-in-95 duration-200"
            style={{
              maxWidth: 380, width: '100%',
              borderRadius: 24,
              padding: 32,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              background: ERA_STYLE[imageModal.era].bg,
              border: `2px solid ${ERA_STYLE[imageModal.era].border}`,
              boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${ERA_STYLE[imageModal.era].border}44`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <span style={{ fontSize: 80, lineHeight: 1 }}>{imageModal.image}</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 18, color: ERA_STYLE[imageModal.era].text, marginBottom: 6 }}>
                {imageModal.title}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: ERA_STYLE[imageModal.era].text, opacity: 0.75 }}>
                {imageModal.year} · {ERA_STYLE[imageModal.era].label}
              </p>
              {imageModal.imageCaption && (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: ERA_STYLE[imageModal.era].text, opacity: 0.70, marginTop: 8 }}>
                  {imageModal.imageCaption}
                </p>
              )}
            </div>
            <button
              onClick={() => setImageModal(null)}
              style={{
                marginTop: 4,
                padding: '8px 24px',
                borderRadius: 9999,
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                background: ERA_STYLE[imageModal.era].border,
                color: '#fff',
              }}
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Timeline;
