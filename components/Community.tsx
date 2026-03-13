import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Loader2, Search } from 'lucide-react';

interface CommunityProps {
  profile: UserProfile | null;
}

const Community: React.FC<CommunityProps> = ({ profile }) => {
  const { user } = useAuth();
  const [classmates, setClassmates] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || !profile?.grade) return;

    const fetchClassmates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('grade', profile.grade)
        .neq('id', user.id);
      
      if (!error && data) {
        setClassmates(data);
      }
      setLoading(false);
    };

    fetchClassmates();
  }, [user, profile]);

  const filteredClassmates = classmates.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.hobbies?.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile?.grade) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Please set your grade in your profile to see classmates.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-500" />
            Class {profile.grade} Community
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Connect with other students in your grade.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search classmates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredClassmates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No classmates found</h3>
          <p className="text-slate-500 mt-1">Be the first to invite your friends!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassmates.map(classmate => (
            <div key={classmate.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden">
                {classmate.avatar_url ? (
                  <img src={classmate.avatar_url} alt={classmate.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                    {classmate.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">{classmate.full_name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-10">
                {classmate.hobbies || "No hobbies listed yet."}
              </p>
              <button className="w-full py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Connect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
