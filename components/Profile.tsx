import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { uploadAvatar } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { getProfanityError } from '../utils/profanity';
import { Loader2 } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
}

const MAX_MB    = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedIndicator, setSavedIndicator] = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [dragOver,       setDragOver]       = useState(false);
  const [preview,        setPreview]        = useState<string | null>(null);
  const [nameError,      setNameError]      = useState<string | null>(null);
  const [hobbiesError,   setHobbiesError]   = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setSavedIndicator(true);
    const t = setTimeout(() => setSavedIndicator(false), 2000);
    return () => clearTimeout(t);
  }, [profile]);

  if (!profile) return null;

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!ALLOWED.includes(file.type)) { setUploadError('Only JPG, PNG, WebP or GIF files are allowed.'); return; }
    if (file.size > MAX_BYTES) { setUploadError(`File is too large. Maximum size is ${MAX_MB} MB.`); return; }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    const result = await uploadAvatar(user!.id, file);
    setUploading(false);
    URL.revokeObjectURL(objectUrl);
    setPreview(null);
    if (result.ok === false) { setUploadError(result.error); return; }
    setProfile({ ...profile, avatar_url: result.url });
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const avatarSrc = preview ?? profile.avatar_url ?? null;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-8 px-4">

      {/* Profile header */}
      <section className="flex flex-col items-center text-center mb-10 pt-4">
        <div className="relative group"
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          title="Click or drop to change photo"
        >
          <div className={`w-24 h-24 rounded-full overflow-hidden cursor-pointer ${dragOver ? 'ring-4 ring-primary ring-offset-2' : ''}`}
            style={{ outline: '4px solid white', boxShadow: '0 4px 16px rgba(15,23,42,0.15)' }}>
            {uploading ? (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : avatarSrc ? (
              <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
            )}
          </div>
          {!uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFileInput} />

        <h2 className="mt-5 font-headline text-4xl text-on-surface">{profile.full_name || 'Your Name'}</h2>
        <p className="text-secondary text-sm font-medium mt-1">{profile.email || ''}</p>

        {(profile.total_points ?? 0) > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed rounded-full shadow-sm">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-xs font-bold tracking-wide uppercase">{profile.total_points?.toLocaleString()} Points</span>
          </div>
        )}
      </section>

      {/* Form card */}
      <div className="relative bg-surface-container-lowest rounded-2xl p-8"
        style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}>
        {savedIndicator && (
          <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold animate-in fade-in">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Saved ✓
          </div>
        )}

        <div className="space-y-7">
          {/* Full name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-secondary tracking-widest uppercase px-1">
              <span className="material-symbols-outlined text-[18px]">person</span>
              Full Name
            </label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={e => {
                const val = e.target.value;
                const err = getProfanityError(val);
                setNameError(err);
                if (!err) setProfile({ ...profile, full_name: val });
              }}
              className={`w-full bg-surface-container-low rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${nameError ? 'ring-2 ring-error' : ''}`}
              style={{ border: 'none' }}
              placeholder="Your full name"
            />
            {nameError && <p className="text-xs text-error px-1">{nameError}</p>}
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-secondary tracking-widest uppercase px-1">
              <span className="material-symbols-outlined text-[18px]">school</span>
              Grade
            </label>
            <div className="relative">
              <select
                value={profile.grade || ''}
                onChange={e => setProfile({ ...profile, grade: e.target.value })}
                className="w-full appearance-none bg-surface-container-low rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                style={{ border: 'none' }}
              >
                <option value="">Select Grade</option>
                {[6, 7, 8, 9, 10].map(g => (
                  <option key={g} value={String(g)}>Class {g}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-secondary tracking-widest uppercase px-1">
              <span className="material-symbols-outlined text-[18px]">interests</span>
              Hobbies &amp; Interests
            </label>
            <textarea
              value={profile.hobbies || ''}
              onChange={e => {
                const val = e.target.value;
                const err = getProfanityError(val);
                setHobbiesError(err);
                if (!err) setProfile({ ...profile, hobbies: val });
              }}
              className={`w-full bg-surface-container-low rounded-xl px-4 py-3.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none ${hobbiesError ? 'ring-2 ring-error' : ''}`}
              style={{ border: 'none' }}
              rows={4}
              placeholder="What do you enjoy learning or doing in your free time?"
            />
            {hobbiesError
              ? <p className="text-xs text-error px-1">{hobbiesError}</p>
              : <p className="text-xs text-outline px-1">Helps the AI personalize examples for you. Saved automatically.</p>}
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-start gap-2 p-3 bg-error-container/40 rounded-xl text-error text-sm">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
              <span className="flex-1">{uploadError}</span>
              <button onClick={() => setUploadError(null)}>
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          <p className="text-xs text-outline px-1">
            Click your avatar to upload a photo · JPG, PNG, WebP or GIF · max {MAX_MB} MB
          </p>
        </div>
      </div>

      {/* XP card */}
      <div className="mt-8 bg-tertiary-fixed/40 p-6 rounded-2xl">
        <span className="material-symbols-outlined text-tertiary mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        <h4 className="text-on-tertiary-fixed font-bold text-lg leading-tight">
          {(profile.total_points ?? 0) > 0 ? `${profile.total_points?.toLocaleString()} XP Earned` : 'Start Earning XP'}
        </h4>
        <p className="text-on-tertiary-fixed-variant/70 text-sm mt-1">Take quizzes and complete concepts to climb the leaderboard.</p>
      </div>
    </div>
  );
};

export default Profile;
