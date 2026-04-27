import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Loader2 } from 'lucide-react';
import { containsProfanity } from '../utils/profanity';
import { supabase } from '../lib/supabase';
import InstitutionDropdown from './InstitutionDropdown';
import type { Institution } from './InstitutionDropdown';

interface ProfilePopupProps {
  onSave:   (profile: Partial<UserProfile>) => Promise<void>;
  profile?: UserProfile | null;  // existing profile (may have some fields already)
}

const GRADES = [6, 7, 8, 9, 10];

const ProfilePopup: React.FC<ProfilePopupProps> = ({ onSave, profile }) => {
  const [fullName,     setFullName]     = useState(profile?.full_name ?? '');
  const [grade,        setGrade]        = useState(profile?.grade     ?? '');
  const [clientId,     setClientId]     = useState(profile?.client_id ?? '');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Fetch active client institutions
  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, logo_url')
      .in('status', ['active', 'trial'])
      .order('name')
      .then(({ data }) => { if (data) setInstitutions(data as Institution[]); });
  }, []);

  // Which fields are missing?
  const needsName   = !profile?.full_name;
  const needsGrade  = !profile?.grade;
  const needsClient = !profile?.client_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (needsName && !fullName.trim()) { setError('Please enter your name.'); return; }
    if (needsName && containsProfanity(fullName)) { setError('Please use your real name.'); return; }
    if (needsGrade && !grade)     { setError('Please select your class.'); return; }
    if (needsClient && !clientId) { setError('Please select your institution.'); return; }

    setLoading(true);
    const updates: Partial<UserProfile> = {};
    if (needsName)   updates.full_name = fullName.trim();
    if (needsGrade)  updates.grade     = grade;
    if (needsClient) updates.client_id = clientId;

    await onSave(updates);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 fade-in duration-300 overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.25)' }}>

        <div className="h-1.5 w-full primary-gradient" />

        <div className="p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl primary-gradient flex items-center justify-center shrink-0 shadow-glow">
              <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface leading-tight">Almost there!</h2>
              <p className="text-xs text-secondary">Tell us a bit about yourself — just once</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-container/40 rounded-xl text-error text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name — only show if missing */}
            {needsName && (
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Your Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    style={{ border: 'none' }}
                    placeholder="Your full name"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Grade — only show if missing */}
            {needsGrade && (
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Class / Grade</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">school</span>
                  <select
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-container text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                    style={{ border: 'none' }}
                  >
                    <option value="">Select your class</option>
                    {GRADES.map(g => (
                      <option key={g} value={String(g)}>Class {g}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[18px]">expand_more</span>
                </div>
              </div>
            )}

            {/* Institution — only show if missing */}
            {needsClient && (
              <div>
                <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">
                  Institution / School <span className="text-error">*</span>
                </label>
                {institutions.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-surface-container text-sm text-outline">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading institutions…
                  </div>
                ) : (
                  <InstitutionDropdown
                    institutions={institutions}
                    value={clientId}
                    onChange={setClientId}
                    required
                    placeholder="Select your institution…"
                  />
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 primary-gradient text-on-primary rounded-xl font-bold text-sm shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</>
                : <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span> Start learning</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
