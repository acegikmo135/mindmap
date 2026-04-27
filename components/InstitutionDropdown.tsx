import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface Institution { id: string; name: string; logo_url?: string; }

interface Props {
  institutions: Institution[];
  value:        string;
  onChange:     (id: string) => void;
  required?:    boolean;
  placeholder?: string;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Deterministic pastel color from institution name
function avatarColor(name: string) {
  const colors = ['#e1e0ff', '#ede9fe', '#d1fae5', '#fef3c7', '#fce7f3', '#dbeafe', '#ffedd5'];
  const textColors = ['#3130c0', '#7c3aed', '#059669', '#b45309', '#9d174d', '#1d4ed8', '#c2410c'];
  const i = name.charCodeAt(0) % colors.length;
  return { bg: colors[i], color: textColors[i] };
}

const InstitutionLogo: React.FC<{ inst: Institution; size?: number }> = ({ inst, size = 32 }) => {
  const { bg, color } = avatarColor(inst.name);
  return (
    <div className="shrink-0 rounded-lg overflow-hidden flex items-center justify-center font-bold text-xs"
      style={{ width: size, height: size, background: bg, color, fontSize: size * 0.35 }}>
      {inst.logo_url
        ? <img src={inst.logo_url} alt={inst.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : initials(inst.name)}
    </div>
  );
};

const InstitutionDropdown: React.FC<Props> = ({
  institutions, value, onChange, required, placeholder = 'Select your institution…'
}) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef    = useRef<HTMLInputElement>(null);

  const selected = institutions.find(i => i.id === value);

  const filtered = institutions.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-[10px] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        style={{
          background: 'var(--color-surface-container-lowest, #ffffff)',
          border: open ? '1.5px solid #c85b32' : '1px solid rgba(199,196,216,0.3)',
        }}
      >
        {selected ? (
          <>
            <InstitutionLogo inst={selected} size={28} />
            <span className="flex-1 text-left font-medium text-on-surface truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-outline text-[20px]">domain</span>
            <span className="flex-1 text-left" style={{ color: '#8b9cb5' }}>{placeholder}</span>
          </>
        )}
        <span className="material-symbols-outlined text-outline text-[18px] shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Hidden native input for form validation */}
      {required && (
        <input tabIndex={-1} required value={value}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, bottom: 0, left: 0 }} />
      )}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl overflow-hidden"
          style={{
            background: 'var(--color-surface-container-lowest, #ffffff)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.14)',
            border: '1px solid rgba(199,196,216,0.25)',
            maxHeight: 280,
          }}>

          {/* Search */}
          {institutions.length > 5 && (
            <div className="p-3 border-b" style={{ borderColor: 'rgba(199,196,216,0.2)' }}>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-outline">search</span>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search institutions…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none text-on-surface"
                  style={{ background: 'var(--color-surface-container, #f0f0f0)', border: 'none' }}
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="overflow-y-auto" style={{ maxHeight: institutions.length > 5 ? 220 : 280 }}>
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-secondary">No institutions found</div>
            ) : (
              filtered.map(inst => {
                const isSelected = inst.id === value;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => handleSelect(inst.id)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors text-left"
                    style={{
                      background: isSelected ? 'rgba(49,48,192,0.07)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <InstitutionLogo inst={inst} size={36} />
                    <span className="flex-1 font-medium truncate"
                      style={{ color: isSelected ? '#c85b32' : 'var(--color-on-surface, #181c20)' }}>
                      {inst.name}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[18px] shrink-0" style={{ color: '#c85b32', fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDropdown;
