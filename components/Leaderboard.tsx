import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Star, Loader2, User, Medal } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(data => setEntries(data))
      .catch(() => {/* error already logged in db.ts */})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 skeleton rounded-2xl mx-auto mb-4" />
          <div className="w-36 h-7 skeleton mx-auto mb-2" />
          <div className="w-48 h-4 skeleton mx-auto" />
        </div>
        {/* Row skeletons */}
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              style={{ opacity: 1 - i * 0.1 }}>
              <div className="w-8 h-6 skeleton shrink-0" />
              <div className="w-10 h-10 skeleton rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-32" />
                <div className="h-3 skeleton w-16" />
              </div>
              <div className="w-12 h-5 skeleton shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const ranked = entries.filter(e => (e.total_points ?? 0) > 0);
  const myRank = ranked.findIndex(e => e.id === user?.id) + 1;

  const medalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-slate-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-slate-300 dark:text-slate-600';
  };

  const rowBg = (id: string) =>
    id === user?.id
      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
      : 'bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-white mb-1">Leaderboard</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Top quiz scorers in your school</p>
        {myRank > 0 && (
          <div className="inline-flex items-center gap-2 mt-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-1.5 rounded-full text-sm font-bold">
            <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
            Your rank: #{myRank}
          </div>
        )}
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No quiz scores yet.</p>
          <p className="text-sm mt-1">Take a quiz to get on the board!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = entry.id === user?.id;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${rowBg(entry.id)}`}
              >
                {/* Rank */}
                <div className="w-8 text-center shrink-0">
                  {rank <= 3 ? (
                    <Medal className={`w-6 h-6 mx-auto ${medalColor(rank)}`} />
                  ) : (
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Name & grade */}
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate text-sm ${isMe ? 'text-primary-700 dark:text-primary-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {entry.full_name || 'Anonymous'} {isMe && '(You)'}
                  </p>
                  {entry.grade && (
                    <p className="text-xs text-slate-400">Class {entry.grade}</p>
                  )}
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Star className={`w-4 h-4 fill-current ${rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-600' : 'text-slate-300 dark:text-slate-500'}`} />
                  <span className={`font-bold text-sm ${isMe ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {entry.total_points?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
