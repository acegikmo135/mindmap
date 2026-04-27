import React, { useState, useEffect, useCallback, useRef } from 'react';
import { XYChart, AnimatedLineSeries, AnimatedBarSeries, Axis, Grid, Tooltip, buildChartTheme } from '@visx/xychart';
import { ParentSize } from '@visx/responsive';
import { AdminSettings, AdminUserRow, FeatureFlags, RateLimits, WeeklyPoint, FeatureStat, UserTokenStat } from '../types';
import {
  adminGetSettings, adminSaveSettings, adminGetAllUsers,
  adminBanUser, adminSetAdmin, adminDeleteUserData,
  adminGetTableStats, adminClearCache, TableStat,
  getUsageLogs, buildWeeklyStats, buildFeatureStats, buildUserTokenStats,
  adminSetUserTokenLimit,
} from '../services/db';

type Tab = 'overview' | 'users' | 'features' | 'ai' | 'database' | 'analytics';

const CARD = { boxShadow: '0 4px 16px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' };

const VISX_THEME = buildChartTheme({
  backgroundColor: 'transparent',
  colors: ['#c85b32', '#4a8fc0'],
  gridColor: 'rgba(199,196,216,0.25)',
  gridColorDark: 'rgba(199,196,216,0.25)',
  tickLength: 4,
  svgLabelSmall: { fill: '#9ca3af', fontSize: 11, fontFamily: 'inherit' },
  svgLabelBig: { fill: '#9ca3af', fontSize: 11, fontFamily: 'inherit' },
});

const FEATURE_LABEL: Record<string, string> = {
  doubt_solver: 'AI Tutor',
  mind_map: 'Mind Map',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  whole_chapter: 'Chapter AI',
  active_recall: 'Active Recall',
  revision: 'Revision',
};

const FEATURE_LABELS: { key: keyof FeatureFlags; label: string; icon: string }[] = [
  { key: 'whole_chapter',  label: 'AI Tutor',        icon: 'psychology'   },
  { key: 'mind_map',       label: 'Mind Map',         icon: 'hub'          },
  { key: 'quiz',           label: 'Quiz',             icon: 'quiz'         },
  { key: 'flashcards',     label: 'Flashcards',       icon: 'style'        },
  { key: 'active_recall',  label: 'Active Recall',    icon: 'bolt'         },
  { key: 'revision',       label: 'Revision Mode',    icon: 'checklist'    },
  { key: 'doubt_solver',   label: 'Doubt Solver',     icon: 'forum'        },
  { key: 'community',      label: 'Community',        icon: 'groups'       },
  { key: 'leaderboard',    label: 'Leaderboard',      icon: 'leaderboard'  },
];

const CACHE_TABLES = [
  { table: 'tutor_cache',                label: 'Tutor Cache'        },
  { table: 'quiz_cache',                 label: 'Quiz Cache'         },
  { table: 'flashcard_cache',            label: 'Flashcard Cache'    },
  { table: 'mindmap_cache',              label: 'Mind Map Cache'     },
  { table: 'chapter_explanation_cache',  label: 'Explanation Cache'  },
];

const Toggle: React.FC<{ on: boolean; onChange: (v: boolean) => void }> = ({ on, onChange }) => (
  <button onClick={() => onChange(!on)}
    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-outline-variant'}`}>
    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : ''}`} />
  </button>
);

const TabBtn: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active ? 'bg-primary-fixed text-primary' : 'text-secondary hover:bg-surface-container'}`}>
    <span className="material-symbols-outlined text-[18px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
    {label}
  </button>
);

const KpiCard: React.FC<{ icon: string; bg: string; text: string; label: string; value: React.ReactNode }> = ({ icon, bg, text, label, value }) => (
  <div className="bg-surface-container-lowest p-5 rounded-2xl animate-in fade-in duration-500" style={CARD}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
      <span className={`material-symbols-outlined text-[20px] ${text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
    <p className="text-xs text-secondary font-semibold uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold text-on-surface mt-0.5">{value}</p>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('overview');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [banModal, setBanModal] = useState<{ user: AdminUserRow; action: 'ban' | 'unban' } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [clearingCache, setClearingCache] = useState<string | null>(null);
  const [actionUser, setActionUser] = useState<string | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{
    weekly: WeeklyPoint[];
    features: FeatureStat[];
    userStats: UserTokenStat[];
    totalTokens: number;
    totalCalls: number;
    avgTokens: number;
    activeToday: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Token limit modal
  const [limitModal, setLimitModal] = useState<{ user: AdminUserRow } | null>(null);
  const [limitValue, setLimitValue] = useState(100000);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try { const s = await adminGetSettings(); if (!cancelled) setSettings(s); } catch (e) { console.error(e); }
      try { const u = await adminGetAllUsers(); if (!cancelled) setUsers(u); } catch (e) { console.error(e); }
      try { const ts = await adminGetTableStats(); if (!cancelled) setTableStats(ts); } catch (e) { console.error(e); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadAnalytics = useCallback(async () => {
    if (analyticsData || analyticsLoading) return;
    setAnalyticsLoading(true);
    try {
      const logs = await getUsageLogs(56);
      const weekly = buildWeeklyStats(logs);
      const features = buildFeatureStats(logs);
      const userStats = buildUserTokenStats(logs, users);
      const totalTokens = logs.reduce((s, l) => s + l.tokens_in + l.tokens_out, 0);
      const totalCalls = logs.length;
      const today = new Date().toISOString().slice(0, 10);
      const activeToday = new Set(logs.filter(l => l.created_at.slice(0, 10) === today).map(l => l.user_id)).size;
      const avgTokens = totalCalls > 0 ? Math.round(totalTokens / totalCalls) : 0;
      setAnalyticsData({ weekly, features, userStats, totalTokens, totalCalls, avgTokens, activeToday });
    } catch (e) { console.error('analytics:', e); }
    setAnalyticsLoading(false);
  }, [analyticsData, analyticsLoading, users]);

  // Autosave 1.5 s after any settings change
  useEffect(() => {
    if (!settings || loading) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await adminSaveSettings(settings);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2500);
      } catch (e) { console.error('autosave:', e); }
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [settings, loading]);

  const handleSave = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    try { await adminSaveSettings(settings); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e: any) { alert('Save failed: ' + e.message); }
    finally { setSaving(false); }
  }, [settings]);

  const setFlag = (key: keyof FeatureFlags, val: boolean) =>
    setSettings(s => s ? { ...s, feature_flags: { ...s.feature_flags, [key]: val } } : s);

  const setLimit = (key: keyof RateLimits, val: number) =>
    setSettings(s => s ? { ...s, rate_limits: { ...s.rate_limits, [key]: val } } : s);

  const handleBan = async () => {
    if (!banModal) return;
    setActionUser(banModal.user.id);
    try {
      await adminBanUser(banModal.user.id, banModal.action === 'ban', banReason || undefined);
      setUsers(u => u.map(user => user.id === banModal.user.id
        ? { ...user, is_banned: banModal.action === 'ban', ban_reason: banModal.action === 'ban' ? banReason : undefined }
        : user));
    } catch (e: any) { alert(e.message); }
    setActionUser(null); setBanModal(null); setBanReason('');
  };

  const handleToggleAdmin = async (user: AdminUserRow) => {
    setActionUser(user.id);
    try {
      await adminSetAdmin(user.id, !user.is_admin);
      setUsers(u => u.map(u2 => u2.id === user.id ? { ...u2, is_admin: !u2.is_admin } : u2));
    } catch (e: any) { alert(e.message); }
    setActionUser(null);
  };

  const handleDeleteData = async (userId: string) => {
    if (!confirm('Delete ALL data for this user? This cannot be undone.')) return;
    setActionUser(userId);
    try { await adminDeleteUserData(userId); } catch (e: any) { alert(e.message); }
    setActionUser(null);
  };

  const handleClearCache = async (table: string, label: string) => {
    if (!confirm(`Clear all entries from ${label}?`)) return;
    setClearingCache(table);
    try {
      await adminClearCache(table);
      setTableStats(ts => ts.map(t => t.table === table ? { ...t, rows: 0 } : t));
    } catch (e: any) { alert(e.message); }
    setClearingCache(null);
  };

  const handleSetTokenLimit = async () => {
    if (!limitModal) return;
    try {
      await adminSetUserTokenLimit(limitModal.user.id, limitValue);
      setUsers(u => u.map(user => user.id === limitModal.user.id ? { ...user, daily_token_limit: limitValue } : user));
    } catch (e: any) { alert(e.message); }
    setLimitModal(null);
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalUsers = users.length;
  const bannedCount = users.filter(u => u.is_banned).length;
  const adminCount = users.filter(u => u.is_admin).length;
  const totalRows = tableStats.reduce((acc, t) => acc + t.rows, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full primary-gradient animate-pulse" />
      <p className="text-secondary text-sm">Loading admin data…</p>
    </div>
  );
  if (!settings) return null;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 pb-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-headline text-4xl text-on-surface">Admin Dashboard</h1>
          <p className="text-secondary mt-1 text-sm">Full control over CogniStruct</p>
        </div>
        <div className="flex items-center gap-3">
          {autoSaved && !saving && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-in fade-in duration-300">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Auto-saved
            </span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 primary-gradient text-on-primary rounded-xl font-semibold text-sm shadow-glow transition-opacity disabled:opacity-60">
            <span className="material-symbols-outlined text-[18px]">{saving ? 'progress_activity' : saved ? 'check_circle' : 'save'}</span>
            {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {settings.maintenance_mode && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-error-container/40 rounded-2xl">
          <span className="material-symbols-outlined text-error text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-error font-bold text-sm">Maintenance Mode Active</p>
            <p className="text-error text-xs opacity-80 truncate">{settings.maintenance_message}</p>
          </div>
          <button onClick={() => setSettings(s => s ? { ...s, maintenance_mode: false } : s)}
            className="text-xs text-error font-semibold hover:underline shrink-0">Disable</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        <TabBtn active={tab === 'overview'}   icon="dashboard"  label="Overview"    onClick={() => setTab('overview')}  />
        <TabBtn active={tab === 'users'}      icon="group"      label="Users"       onClick={() => setTab('users')}     />
        <TabBtn active={tab === 'features'}   icon="toggle_on"  label="Features"    onClick={() => setTab('features')}  />
        <TabBtn active={tab === 'ai'}         icon="smart_toy"  label="AI & Limits" onClick={() => setTab('ai')}        />
        <TabBtn active={tab === 'analytics'}  icon="insights"   label="Analytics"   onClick={() => { setTab('analytics'); loadAnalytics(); }} />
        <TabBtn active={tab === 'database'}   icon="database"   label="Database"    onClick={() => setTab('database')}  />
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon="group"         bg="bg-primary-fixed"        text="text-primary"    label="Total Users"  value={totalUsers} />
            <KpiCard icon="block"         bg="bg-error-container"      text="text-error"      label="Banned"       value={bannedCount} />
            <KpiCard icon="shield_person" bg="bg-tertiary-fixed"       text="text-tertiary"   label="Admins"       value={adminCount} />
            <KpiCard icon="storage"       bg="bg-secondary-container"  text="text-secondary"  label="Total Rows"   value={totalRows.toLocaleString()} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
              <h3 className="font-headline text-xl text-on-surface mb-5">Database Table Sizes</h3>
              <div className="h-56">
                <ParentSize>
                  {({ width }) => (
                    <XYChart width={width} height={224} theme={VISX_THEME}
                      xScale={{ type: 'band', paddingInner: 0.3 }}
                      yScale={{ type: 'linear', nice: true }}>
                      <Grid rows numTicks={4} />
                      <AnimatedBarSeries dataKey="Rows"
                        data={tableStats.slice(0, 7)}
                        xAccessor={d => d.label}
                        yAccessor={d => d.rows}
                        colorAccessor={() => '#c85b32'}
                      />
                      <Axis orientation="bottom" tickFormat={v => String(v).slice(0, 8)} />
                      <Axis orientation="left" numTicks={4} />
                      <Tooltip renderTooltip={({ tooltipData }) => {
                        const d = tooltipData?.nearestDatum?.datum as TableStat;
                        return d ? <div className="text-xs font-bold px-2 py-1">{d.label}: {d.rows.toLocaleString()}</div> : null;
                      }} />
                    </XYChart>
                  )}
                </ParentSize>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
              <h3 className="font-headline text-xl text-on-surface mb-4">Feature Status</h3>
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                {FEATURE_LABELS.map(f => {
                  const on = settings.feature_flags[f.key];
                  return (
                    <div key={f.key} className={`flex items-center gap-2 p-3 rounded-xl ${on ? 'bg-primary-fixed/60' : 'bg-surface-container'}`}>
                      <span className={`material-symbols-outlined text-[16px] ${on ? 'text-primary' : 'text-outline'}`}>{f.icon}</span>
                      <span className={`text-xs font-medium flex-1 truncate ${on ? 'text-primary' : 'text-secondary'}`}>{f.label}</span>
                      <span className={`text-[10px] font-bold ${on ? 'text-primary' : 'text-outline'}`}>{on ? 'ON' : 'OFF'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS ───────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full bg-surface-container-lowest rounded-xl pl-10 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                style={CARD} />
            </div>
            <div className="text-xs text-secondary font-medium shrink-0">{filteredUsers.length} users</div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(199,196,216,0.2)' }}>
                    {['User', 'Grade', 'Points', 'Daily Limit', 'Status', 'Role', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-bold text-secondary tracking-wider uppercase px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-surface-container transition-colors"
                      style={{ borderColor: 'rgba(199,196,216,0.1)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 overflow-hidden">
                            {user.avatar_url
                              ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-on-surface truncate max-w-[140px]">{user.full_name || '—'}</p>
                            <p className="text-xs text-secondary truncate max-w-[140px]">{user.email || user.id.slice(0, 8) + '…'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">{user.grade ? `Class ${user.grade}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-fixed text-primary text-xs font-bold rounded-full">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          {(user.total_points ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setLimitModal({ user }); setLimitValue(user.daily_token_limit ?? 100000); }}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px] text-secondary">token</span>
                          {((user.daily_token_limit ?? 100000) / 1000).toFixed(0)}k
                          <span className="material-symbols-outlined text-[12px] text-outline">edit</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {user.is_banned
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error-container/40 text-error text-xs font-bold rounded-full">
                              <span className="material-symbols-outlined text-[12px]">block</span> Banned
                            </span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-emerald-700 text-xs font-bold rounded-full">
                              <span className="material-symbols-outlined text-[12px]">check_circle</span> Active
                            </span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {user.is_admin
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tertiary-fixed text-tertiary text-xs font-bold rounded-full">
                              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span> Admin
                            </span>
                          : <span className="text-xs text-secondary">Student</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button disabled={actionUser === user.id}
                            onClick={() => setBanModal({ user, action: user.is_banned ? 'unban' : 'ban' })}
                            className={`p-1.5 rounded-lg transition-colors ${user.is_banned ? 'text-emerald-600 hover:bg-green-50' : 'text-error hover:bg-error-container/30'} disabled:opacity-40`}>
                            <span className="material-symbols-outlined text-[18px]">{user.is_banned ? 'lock_open' : 'block'}</span>
                          </button>
                          <button disabled={actionUser === user.id}
                            onClick={() => handleToggleAdmin(user)}
                            className="p-1.5 rounded-lg text-secondary hover:bg-surface-container transition-colors disabled:opacity-40">
                            <span className="material-symbols-outlined text-[18px]">shield_person</span>
                          </button>
                          <button disabled={actionUser === user.id}
                            onClick={() => handleDeleteData(user.id)}
                            className="p-1.5 rounded-lg text-error hover:bg-error-container/30 transition-colors disabled:opacity-40">
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-secondary text-sm">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      {tab === 'features' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-error">construction</span>
                  Maintenance Mode
                </h3>
                <p className="text-xs text-secondary mt-0.5">Blocks all users from accessing the app</p>
              </div>
              <Toggle on={settings.maintenance_mode} onChange={v => setSettings(s => s ? { ...s, maintenance_mode: v } : s)} />
            </div>
            <textarea value={settings.maintenance_message}
              onChange={e => setSettings(s => s ? { ...s, maintenance_message: e.target.value } : s)}
              className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={2} placeholder="Maintenance message…" style={{ border: 'none' }} />
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">Feature Flags</h3>
            <p className="text-xs text-secondary mb-5">Disable a feature to hide it from all users instantly.</p>
            <div className="space-y-3">
              {FEATURE_LABELS.map(f => {
                const on = settings.feature_flags[f.key];
                return (
                  <div key={f.key} className={`flex items-center justify-between p-4 rounded-xl transition-colors ${on ? 'bg-primary-fixed/40' : 'bg-surface-container'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${on ? 'text-primary' : 'text-outline'}`} style={on ? { fontVariationSettings: "'FILL' 1" } : {}}>{f.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${on ? 'text-on-surface' : 'text-secondary'}`}>{f.label}</p>
                        <p className="text-xs text-outline">{on ? 'Enabled — visible to all users' : 'Disabled — hidden from users'}</p>
                      </div>
                    </div>
                    <Toggle on={on} onChange={v => setFlag(f.key, v)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI & LIMITS ──────────────────────────────────────────── */}
      {tab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">AI Model</h3>
            <p className="text-xs text-secondary mb-4">Affects AI Tutor, Quiz, Flashcard, and Explanation generation.</p>
            <div className="relative">
              <select value={settings.ai_model}
                onChange={e => setSettings(s => s ? { ...s, ai_model: e.target.value } : s)}
                className="w-full appearance-none bg-surface-container rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm"
                style={{ border: 'none' }}>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (fastest, cheapest)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (balanced)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (best quality)</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Chatbot token limit */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">AI Chatbot — Daily Output Tokens</h3>
            <p className="text-xs text-secondary mb-4">
              Counts only the AI's <strong>response tokens</strong> (output), not your question. Set per-user in <strong>Users → Daily Limit</strong>.
              Cached answers are always free.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-secondary">forum</span>
                  Default limit (tokens / day)
                </label>
                <input type="number" value={settings.rate_limits.chatbot_daily_tokens} min={500} max={500000} step={500}
                  onChange={e => setLimit('chatbot_daily_tokens', Math.max(500, parseInt(e.target.value) || 500))}
                  className="w-24 bg-surface-container rounded-xl px-3 py-1.5 text-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  style={{ border: 'none' }} />
              </div>
              <input type="range" min={500} max={50000} step={500} value={settings.rate_limits.chatbot_daily_tokens}
                onChange={e => setLimit('chatbot_daily_tokens', parseInt(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-outline">
                <span>500</span>
                <span className="text-primary font-semibold">{settings.rate_limits.chatbot_daily_tokens.toLocaleString()} tokens ≈ {Math.round(settings.rate_limits.chatbot_daily_tokens / 100)} msgs</span>
                <span>50k</span>
              </div>
            </div>
          </div>

          {/* Feature call limits */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">Cached Feature Call Limits</h3>
            <p className="text-xs text-secondary mb-5">
              Each time a user loads a feature (even from cache), it counts. Resets every hour. Set 0 to disable limit.
            </p>
            <div className="space-y-5">
              {([
                { key: 'mindmap_calls_per_hour'      as keyof RateLimits, label: 'Mind Map loads / hour',       icon: 'hub',         min: 0, max: 50  },
                { key: 'quiz_calls_per_hour'         as keyof RateLimits, label: 'Quiz loads / hour',           icon: 'quiz',        min: 0, max: 100 },
                { key: 'flashcard_calls_per_hour'    as keyof RateLimits, label: 'Flashcard loads / hour',      icon: 'style',       min: 0, max: 100 },
                { key: 'explanation_calls_per_hour'  as keyof RateLimits, label: 'Chapter AI loads / hour',     icon: 'auto_stories',min: 0, max: 50  },
              ]).map(({ key, label, icon, min, max }) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                      <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
                      {label}
                    </label>
                    <input type="number" value={settings.rate_limits[key]} min={min} max={max}
                      onChange={e => setLimit(key, Math.max(min, Math.min(max, parseInt(e.target.value) || min)))}
                      className="w-20 bg-surface-container rounded-xl px-3 py-1.5 text-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                      style={{ border: 'none' }} />
                  </div>
                  <input type="range" min={min} max={max} value={settings.rate_limits[key]}
                    onChange={e => setLimit(key, parseInt(e.target.value))}
                    className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-outline">
                    <span>{min === 0 ? 'No limit' : min}</span>
                    <span>{max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">File Upload Limit</h3>
            <p className="text-xs text-secondary mb-4">Maximum avatar upload size in MB.</p>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={20} value={settings.max_file_upload_mb}
                onChange={e => setSettings(s => s ? { ...s, max_file_upload_mb: parseInt(e.target.value) } : s)}
                className="flex-1 accent-primary" />
              <span className="w-16 text-center font-bold text-on-surface text-sm bg-surface-container rounded-xl py-1.5">{settings.max_file_upload_mb} MB</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ─────────────────────────────────────────────── */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 rounded-full primary-gradient animate-pulse" />
              <p className="text-secondary text-sm">Loading analytics…</p>
            </div>
          )}

          {!analyticsLoading && analyticsData && (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon="token"         bg="bg-primary-fixed"       text="text-primary"   label="Total Tokens"   value={(analyticsData.totalTokens / 1000).toFixed(1) + 'k'} />
                <KpiCard icon="api"           bg="bg-secondary-container" text="text-secondary" label="API Calls"      value={analyticsData.totalCalls.toLocaleString()} />
                <KpiCard icon="avg_pace"      bg="bg-tertiary-fixed"      text="text-tertiary"  label="Avg Tokens/Call" value={analyticsData.avgTokens.toLocaleString()} />
                <KpiCard icon="person_check"  bg="bg-primary-fixed"       text="text-primary"   label="Active Today"  value={analyticsData.activeToday} />
              </div>

              {/* Weekly Activity Line Chart */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
                <h3 className="font-headline text-xl text-on-surface mb-1">Weekly Activity</h3>
                <div className="flex items-center gap-4 mb-5">
                  <span className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="w-3 h-0.5 bg-primary rounded-full inline-block" /> Unique Users
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-secondary">
                    <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block" /> API Calls
                  </span>
                </div>
                <div className="h-64">
                  <ParentSize>
                    {({ width }) => (
                      <XYChart width={width} height={256} theme={VISX_THEME}
                        xScale={{ type: 'band', paddingInner: 0.4 }}
                        yScale={{ type: 'linear', nice: true }}>
                        <Grid rows numTicks={5} />
                        <AnimatedLineSeries dataKey="Users" data={analyticsData.weekly}
                          xAccessor={d => d.name} yAccessor={d => d.users} curve={undefined} />
                        <AnimatedLineSeries dataKey="Calls" data={analyticsData.weekly}
                          xAccessor={d => d.name} yAccessor={d => d.calls} curve={undefined} />
                        <Axis orientation="bottom" />
                        <Axis orientation="left" numTicks={5} />
                        <Tooltip
                          renderTooltip={({ tooltipData }) => {
                            const d = tooltipData?.nearestDatum?.datum as WeeklyPoint;
                            return d ? (
                              <div className="px-3 py-2 text-xs space-y-1">
                                <p className="font-bold text-on-surface">{d.name}</p>
                                <p className="text-primary">Users: <strong>{d.users}</strong></p>
                                <p className="text-sky-500">Calls: <strong>{d.calls}</strong></p>
                              </div>
                            ) : null;
                          }}
                        />
                      </XYChart>
                    )}
                  </ParentSize>
                </div>
              </div>

              {/* Feature Usage Bar Chart */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
                <h3 className="font-headline text-xl text-on-surface mb-5">Feature Usage</h3>
                {analyticsData.features.length === 0 ? (
                  <p className="text-center text-secondary text-sm py-8">No feature usage data yet.</p>
                ) : (
                  <div className="h-56">
                    <ParentSize>
                      {({ width }) => (
                        <XYChart width={width} height={224} theme={VISX_THEME}
                          xScale={{ type: 'band', paddingInner: 0.3 }}
                          yScale={{ type: 'linear', nice: true }}>
                          <Grid rows numTicks={4} />
                          <AnimatedBarSeries dataKey="Calls"
                            data={analyticsData.features}
                            xAccessor={d => FEATURE_LABEL[d.feature] ?? d.feature}
                            yAccessor={d => d.calls}
                            colorAccessor={() => '#c85b32'}
                          />
                          <Axis orientation="bottom" />
                          <Axis orientation="left" numTicks={4} />
                          <Tooltip
                            renderTooltip={({ tooltipData }) => {
                              const d = tooltipData?.nearestDatum?.datum as FeatureStat;
                              return d ? (
                                <div className="px-3 py-2 text-xs space-y-1">
                                  <p className="font-bold">{FEATURE_LABEL[d.feature] ?? d.feature}</p>
                                  <p>Calls: <strong>{d.calls}</strong></p>
                                  <p>Tokens: <strong>{d.tokens.toLocaleString()}</strong></p>
                                </div>
                              ) : null;
                            }}
                          />
                        </XYChart>
                      )}
                    </ParentSize>
                  </div>
                )}
              </div>

              {/* Top users token table */}
              <div className="bg-surface-container-lowest rounded-2xl overflow-hidden" style={CARD}>
                <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(199,196,216,0.2)' }}>
                  <h3 className="font-bold text-on-surface">Top Users by Token Usage</h3>
                  <p className="text-xs text-secondary mt-0.5">Last 56 days · top 15</p>
                </div>
                {analyticsData.userStats.length === 0 ? (
                  <p className="text-center text-secondary text-sm py-8">No token usage data yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'rgba(199,196,216,0.1)' }}>
                          {['#', 'Student', 'Tokens Used', 'API Calls', 'Daily Limit', 'Usage'].map(h => (
                            <th key={h} className="text-left text-xs font-bold text-secondary tracking-wider uppercase px-5 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.userStats.map((s, i) => {
                          const pct = Math.min(100, Math.round((s.tokens / s.daily_limit) * 100));
                          return (
                            <tr key={s.user_id} className="border-b hover:bg-surface-container transition-colors"
                              style={{ borderColor: 'rgba(199,196,216,0.08)' }}>
                              <td className="px-5 py-3 font-bold text-secondary">#{i + 1}</td>
                              <td className="px-5 py-3 font-semibold text-on-surface">{s.full_name}</td>
                              <td className="px-5 py-3 font-bold text-primary">{s.tokens.toLocaleString()}</td>
                              <td className="px-5 py-3 text-secondary">{s.calls}</td>
                              <td className="px-5 py-3 text-secondary">{(s.daily_limit / 1000).toFixed(0)}k/day</td>
                              <td className="px-5 py-3 w-32">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-error' : pct > 50 ? 'bg-amber-400' : 'bg-primary'}`}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-secondary w-8 text-right">{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {!analyticsLoading && !analyticsData && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined text-outline text-[48px]">insights</span>
              <p className="text-secondary text-sm">Click the Analytics tab to load data.</p>
              <button onClick={loadAnalytics}
                className="px-4 py-2 primary-gradient text-white rounded-xl text-sm font-semibold shadow-glow">
                Load Analytics
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DATABASE ─────────────────────────────────────────────── */}
      {tab === 'database' && (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden" style={CARD}>
            <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(199,196,216,0.2)' }}>
              <h3 className="font-bold text-on-surface">Table Stats</h3>
              <p className="text-xs text-secondary mt-0.5">Row counts for all tables. Refresh page for latest.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(199,196,216,0.1)' }}>
                    {['Table', 'Rows', 'Bar'].map(h => (
                      <th key={h} className="text-left text-xs font-bold text-secondary tracking-wider uppercase px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableStats.map(stat => {
                    const maxRows = Math.max(...tableStats.map(t => t.rows), 1);
                    const pct = Math.round((stat.rows / maxRows) * 100);
                    return (
                      <tr key={stat.table} className="border-b hover:bg-surface-container transition-colors" style={{ borderColor: 'rgba(199,196,216,0.08)' }}>
                        <td className="px-5 py-3 font-mono text-xs text-secondary">{stat.table}</td>
                        <td className="px-5 py-3 font-bold text-on-surface">{stat.rows.toLocaleString()}</td>
                        <td className="px-5 py-3 w-48">
                          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl" style={CARD}>
            <h3 className="font-bold text-on-surface mb-1">Clear Cache Tables</h3>
            <p className="text-xs text-secondary mb-5">Deletes all rows. AI regenerates on next request. Irreversible.</p>
            <div className="space-y-3">
              {CACHE_TABLES.map(({ table, label }) => (
                <div key={table} className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] text-secondary">cached</span>
                    <div>
                      <p className="font-semibold text-sm text-on-surface">{label}</p>
                      <p className="text-xs text-outline font-mono">{table}</p>
                    </div>
                  </div>
                  <button disabled={clearingCache === table} onClick={() => handleClearCache(table, label)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-error-container/40 text-error rounded-xl text-xs font-bold hover:bg-error-container/60 transition-colors disabled:opacity-50">
                    {clearingCache === table
                      ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-[16px]">delete_sweep</span>}
                    Clear
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ban modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" style={CARD}>
            <h3 className="font-bold text-lg text-on-surface mb-1">
              {banModal.action === 'ban' ? `Ban ${banModal.user.full_name || 'user'}?` : `Unban ${banModal.user.full_name || 'user'}?`}
            </h3>
            <p className="text-sm text-secondary mb-4">
              {banModal.action === 'ban' ? 'The user will be blocked from signing in.' : 'The user will regain access.'}
            </p>
            {banModal.action === 'ban' && (
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)}
                placeholder="Ban reason (optional)…"
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
                rows={2} style={{ border: 'none' }} />
            )}
            <div className="flex gap-3">
              <button onClick={() => { setBanModal(null); setBanReason(''); }}
                className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high transition-colors">Cancel</button>
              <button onClick={handleBan}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${banModal.action === 'ban' ? 'bg-error hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {banModal.action === 'ban' ? 'Ban User' : 'Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token limit modal */}
      {limitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" style={CARD}>
            <h3 className="font-bold text-lg text-on-surface mb-1">Set Daily Token Limit</h3>
            <p className="text-sm text-secondary mb-5">
              For <strong>{limitModal.user.full_name || 'this user'}</strong>. Only AI Tutor chat counts toward this limit. Cached answers are always free.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={limitValue}
                  min={1000}
                  max={10000000}
                  step={1000}
                  onChange={e => setLimitValue(Math.max(1000, parseInt(e.target.value) || 1000))}
                  className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                  style={{ border: 'none' }}
                />
                <span className="text-sm text-secondary font-semibold shrink-0">tokens/day</span>
              </div>
              <input type="range" min={10000} max={1000000} step={10000} value={limitValue}
                onChange={e => setLimitValue(parseInt(e.target.value))}
                className="w-full accent-primary" />
              <div className="flex justify-between text-xs text-outline">
                <span>10k</span>
                <span className="font-bold text-primary">{(limitValue / 1000).toFixed(0)}k tokens</span>
                <span>1M</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 500000].map(v => (
                  <button key={v} onClick={() => setLimitValue(v)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-colors ${limitValue === v ? 'bg-primary text-white' : 'bg-surface-container text-secondary hover:bg-surface-container-high'}`}>
                    {v / 1000}k
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setLimitModal(null)}
                className="flex-1 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high transition-colors">Cancel</button>
              <button onClick={handleSetTokenLimit}
                className="flex-1 py-2.5 primary-gradient rounded-xl text-sm font-bold text-white shadow-glow">Set Limit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
