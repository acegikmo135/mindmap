import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { User, Mail, BookOpen, Smile, Check, Star, Trophy, Camera, Loader2, AlertCircle, X } from 'lucide-react';
import { uploadAvatar } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { getProfanityError } from '../utils/profanity';

interface ProfileProps {
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
}

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedIndicator, setSavedIndicator]   = useState(false);
  const [uploading,      setUploading]         = useState(false);
  const [uploadError,    setUploadError]       = useState<string | null>(null);
  const [dragOver,       setDragOver]          = useState(false);
  const [preview,        setPreview]           = useState<string | null>(null);
  const [nameError,      setNameError]         = useState<string | null>(null);
  const [hobbiesError,   setHobbiesError]      = useState<string | null>(null);

  // Auto-saved flash whenever profile changes externally
  useEffect(() => {
    if (!profile) return;
    setSavedIndicator(true);
    const t = setTimeout(() => setSavedIndicator(false), 2000);
    return () => clearTimeout(t);
  }, [profile]);

  if (!profile) return null;

  // ── File validation + upload ─────────────────────────────────────────────
  const handleFile = async (file: File) => {
    setUploadError(null);

    if (!ALLOWED.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP or GIF files are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    const result = await uploadAvatar(user!.id, file);

    setUploading(false);
    URL.revokeObjectURL(objectUrl);
    setPreview(null);

    if (result.ok === false) {
      setUploadError(result.error);
      return;
    }

    setProfile({ ...profile, avatar_url: result.url });
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const avatarSrc = preview ?? profile.avatar_url ?? null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2">Your Profile</h2>
          <p className="text-slate-500 dark:text-slate-400">Manage your personal information and learning preferences.</p>
        </div>
        {savedIndicator && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium animate-in fade-in">
            <Check className="w-4 h-4" />
            Saved
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary-500 to-blue-600 relative">

          {/* Avatar with upload overlay */}
          <div className="absolute -bottom-12 left-8">
            <div
              className={`relative w-24 h-24 rounded-full group cursor-pointer
                ${dragOver ? 'ring-4 ring-white ring-offset-2' : ''}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              title="Click or drop to change photo"
            >
              {/* White border ring */}
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                  ) : avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Camera overlay on hover */}
              {!uploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onFileInput}
            />
          </div>
        </div>

        {/* Body */}
        <div className="pt-16 pb-8 px-8 space-y-6">

          {/* Points badge (right of avatar space) */}
          {(profile.total_points ?? 0) > 0 && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl px-4 py-3">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider leading-none mb-0.5">Quiz Points</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300 leading-none">{profile.total_points?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload hint + error */}
          <div className="space-y-2">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Click your avatar above to upload a photo · JPG, PNG, WebP or GIF · max {MAX_MB} MB
            </p>
            {uploadError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="shrink-0 hover:opacity-70">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const err = getProfanityError(val);
                    setNameError(err);
                    if (!err) setProfile({ ...profile, full_name: val });
                  }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-slate-800 dark:text-slate-100 ${nameError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'}`}
                  placeholder="John Doe"
                />
              </div>
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grade / Class</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={profile.grade || ''}
                  onChange={e => setProfile({ ...profile, grade: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all appearance-none text-slate-800 dark:text-slate-100"
                >
                  <option value="">Select Grade</option>
                  <option value="6">Class 6</option>
                  <option value="7">Class 7</option>
                  <option value="8">Class 8</option>
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hobbies & Interests</label>
            <div className="relative">
              <Smile className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={profile.hobbies || ''}
                onChange={e => {
                  const val = e.target.value;
                  const err = getProfanityError(val);
                  setHobbiesError(err);
                  if (!err) setProfile({ ...profile, hobbies: val });
                }}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[80px] text-slate-800 dark:text-slate-100 ${hobbiesError ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'}`}
                placeholder="Reading, Coding, Football..."
              />
            </div>
            {hobbiesError
              ? <p className="text-xs text-red-500 mt-1">{hobbiesError}</p>
              : <p className="text-xs text-slate-400 mt-1">Helps the AI personalize examples for you. Saved automatically.</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
