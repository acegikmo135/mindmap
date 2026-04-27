import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

// podIdx 0=gold, 1=silver, 2=bronze
const PODIUM_CFG = [
  { medal: '🥇', borderColor: '#F59E0B', blockColor: '#F59E0B', avatarSize: 76, blockHeight: 168, riseDelay: 0.5 },
  { medal: '🥈', borderColor: '#94A3B8', blockColor: '#94A3B8', avatarSize: 60, blockHeight: 124, riseDelay: 0.25 },
  { medal: '🥉', borderColor: '#B07336', blockColor: '#9B6B3A', avatarSize: 52, blockHeight: 104, riseDelay: 0 },
];
const POD_ORDER = [1, 0, 2]; // column positions: silver | gold | bronze

const INIT_SHOW = 5;

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(data => setEntries(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 pb-8">
        <div className="text-center mb-10">
          <div className="w-20 h-20 skeleton rounded-full mx-auto mb-4" />
          <div className="w-36 h-7 skeleton mx-auto mb-2" />
          <div className="w-48 h-4 skeleton mx-auto" />
        </div>
        <div className="grid grid-cols-3 gap-3 items-end mb-10">
          {[124, 168, 104].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="skeleton rounded-full" style={{ width: [60, 76, 52][i], height: [60, 76, 52][i] }} />
              <div className="skeleton w-full rounded-2xl" style={{ height: h }} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest" style={{ opacity: 1 - i * 0.15 }}>
              <div className="w-8 h-5 skeleton shrink-0" />
              <div className="w-10 h-10 skeleton rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-32" />
                <div className="h-3 skeleton w-24" />
              </div>
              <div className="w-16 h-7 skeleton shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ranked = entries.filter(e => (e.total_points ?? 0) > 0);
  const myRank = ranked.findIndex(e => e.id === user?.id) + 1;
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  const listEntries = rest;
  const visibleEntries = showAll ? listEntries : listEntries.slice(0, INIT_SHOW);

  return (
    <div className="max-w-2xl mx-auto pb-8 px-4">
      <style>{`
        @keyframes podiumRise {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes avatarAppear {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 pt-6" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-primary-fixed">
          <span className="material-symbols-outlined text-primary text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
        </div>
        <h1 className="font-headline text-5xl text-on-surface mb-2">Leaderboard</h1>
        <p className="text-secondary font-medium text-sm">Recognizing the top academic luminaries of the week</p>
        {myRank > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 bg-primary-fixed text-primary px-4 py-1.5 rounded-full text-sm font-bold">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            Your rank: #{myRank}
          </div>
        )}
      </div>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>trophy</span>
          </div>
          <h3 className="font-headline text-2xl text-on-surface mb-2">No scores yet</h3>
          <p className="text-secondary text-sm">Take a quiz to get on the board!</p>
        </div>
      ) : (
        <>
          {/* ── Podium ── */}
          <div className="grid grid-cols-3 gap-3 items-end mb-10">
            {POD_ORDER.map(podIdx => {
              const entry = top3[podIdx] ?? null;
              const cfg = PODIUM_CFG[podIdx];
              const avatarR = cfg.avatarSize / 2;

              return (
                <div key={podIdx} className="flex flex-col items-center">
                  {/* Crown above gold */}
                  <div style={{ height: 28, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: `avatarAppear 0.4s ease ${cfg.riseDelay + 0.7}s both` }}>
                    {podIdx === 0 && (
                      <span className="material-symbols-outlined text-[28px]" style={{ color: '#F59E0B', fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    )}
                  </div>

                  {/* Avatar — overlaps block top via negative margin */}
                  <div
                    className="relative z-10"
                    style={{
                      width: cfg.avatarSize,
                      height: cfg.avatarSize,
                      marginBottom: -(avatarR),
                      animation: `avatarAppear 0.45s cubic-bezier(0.34,1.56,0.64,1) ${cfg.riseDelay + 0.45}s both`,
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gray-200 font-bold text-gray-500"
                      style={{ border: `3px solid ${cfg.borderColor}`, fontSize: cfg.avatarSize * 0.35 }}
                    >
                      {entry?.avatar_url
                        ? <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                        : entry
                          ? <span>{entry.full_name?.charAt(0) || '?'}</span>
                          : <span className="material-symbols-outlined" style={{ fontSize: cfg.avatarSize * 0.45, color: '#9CA3AF' }}>person</span>
                      }
                    </div>
                    {/* Medal badge */}
                    <div
                      className="absolute -bottom-1 -right-1 bg-white rounded-full flex items-center justify-center shadow"
                      style={{ width: 22, height: 22, fontSize: 13 }}
                    >
                      {cfg.medal}
                    </div>
                  </div>

                  {/* Block — rises from bottom */}
                  <div
                    className="w-full rounded-2xl flex flex-col items-center justify-end pb-4 text-center shadow-sm"
                    style={{
                      height: cfg.blockHeight,
                      backgroundColor: cfg.blockColor,
                      transformOrigin: 'bottom',
                      animation: `podiumRise 0.65s cubic-bezier(0.34,1.56,0.64,1) ${cfg.riseDelay}s both`,
                      paddingTop: avatarR + 8,
                    }}
                  >
                    <span className="font-bold text-white text-sm leading-tight px-2 truncate w-full">
                      {entry ? (entry.full_name || 'Anonymous') : `${['1st','2nd','3rd'][podIdx]} Place`}
                    </span>
                    <span className="text-white/80 text-xs font-semibold mt-0.5">
                      {entry ? `${entry.total_points?.toLocaleString()} pts` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Regional Rankings list ── */}
          <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(15,23,42,0.07)', animation: 'fadeUp 0.5s ease 0.3s both' }}>
            {/* Header */}
            <div className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(200,91,50,0.10)' }}>
              <h2 className="font-bold text-on-surface text-base">Regional Rankings</h2>
              <span className="text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider" style={{ background: '#fde8de', color: '#a84928' }}>
                All Time
              </span>
            </div>

            {/* Rows */}
            <div>
              {visibleEntries.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No other rankings yet.</p>
              )}
              {visibleEntries.map((entry, idx) => {
                const rank = idx + 4;
                const isMe = entry.id === user?.id;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center px-6 py-3.5 transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(200,91,50,0.07)',
                      background: isMe ? 'rgba(200,91,50,0.07)' : 'transparent',
                      borderLeft: isMe ? '4px solid #c85b32' : '4px solid transparent',
                    }}
                  >
                    {/* Rank */}
                    <div
                      className="w-8 shrink-0 font-bold text-base"
                      style={{ color: isMe ? '#c85b32' : '#94A3B8' }}
                    >
                      {rank}
                    </div>

                    {/* Avatar */}
                    <div className="relative mr-4 shrink-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-secondary bg-surface-container" style={{ fontSize: 16 }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                          : <span>{entry.full_name?.charAt(0) || '?'}</span>}
                      </div>
                      {isMe && (
                        <div className="absolute -top-1.5 -right-1.5 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight shadow" style={{ background: '#c85b32' }}>
                          YOU
                        </div>
                      )}
                    </div>

                    {/* Name + grade */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: isMe ? '#c85b32' : 'var(--cs-os)' }}>
                        {entry.full_name || 'Anonymous'}
                      </div>
                      {entry.grade && (
                        <div className="text-xs mt-0.5 text-secondary">
                          Grade {entry.grade}
                        </div>
                      )}
                    </div>

                    {/* Points pill */}
                    <div
                      className="px-4 py-1.5 rounded-full text-sm font-bold shrink-0"
                      style={isMe
                        ? { background: '#c85b32', color: '#fff' }
                        : { background: 'var(--cs-sc)', color: 'var(--cs-osv)' }}
                    >
                      {entry.total_points?.toLocaleString() ?? 0}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All toggle */}
            {listEntries.length > INIT_SHOW && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full py-4 flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors hover:bg-primary-fixed"
                style={{ color: '#c85b32', borderTop: '1px solid rgba(200,91,50,0.10)' }}
              >
                {showAll ? 'Show Less' : 'View All Rankings'}
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ transition: 'transform 0.2s', transform: showAll ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
