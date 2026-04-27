import React, { useState, useEffect } from 'react';
import { UserProfile, FriendRequest } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendFriendRequest, getFriendRequests, updateFriendRequestStatus, deleteFriendRequest } from '../services/db';
import { sendPushNotification } from '../services/notifications';
import { Loader2 } from 'lucide-react';

interface CommunityProps {
  profile: UserProfile | null;
}

const Community: React.FC<CommunityProps> = ({ profile }) => {
  const { user } = useAuth();
  const [classmates, setClassmates] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'REQUESTS' | 'FRIENDS'>('EXPLORE');
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [incomingRequestIds, setIncomingRequestIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async () => {
    if (!user || !profile?.grade) return;
    setLoading(true);
    try {
      const { data: classmatesData, error: ce } = await supabase
        .from('profiles')
        .select('id, full_name, grade, avatar_url, hobbies')
        .eq('grade', profile.grade)
        .neq('id', user.id);
      if (ce) throw ce;
      setClassmates(classmatesData || []);

      const { data: allReqs, error: re } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      if (re) throw re;

      if (allReqs) {
        const sent     = allReqs.filter(r => r.sender_id === user.id && r.status === 'PENDING').map(r => r.receiver_id);
        const incoming = allReqs.filter(r => r.receiver_id === user.id && r.status === 'PENDING').map(r => r.sender_id);
        const accepted = allReqs.filter(r => r.status === 'ACCEPTED').map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
        setSentRequestIds(sent);
        setIncomingRequestIds(incoming);
        setAcceptedFriendIds(accepted);
        setFriends(classmatesData?.filter(c => accepted.includes(c.id)) || []);
        setRequests(allReqs.filter(r => r.receiver_id === user.id && r.status === 'PENDING').map(req => ({
          ...req,
          sender_name:   classmatesData?.find(c => c.id === req.sender_id)?.full_name || 'Classmate',
          sender_avatar: classmatesData?.find(c => c.id === req.sender_id)?.avatar_url,
        })) as FriendRequest[]);
      }
    } catch (err) {
      console.error('Community fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, profile]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg); setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.id, receiverId);
      setSentRequestIds(p => [...p, receiverId]);
      triggerToast('Friend request sent!');
      sendPushNotification(receiverId, 'New Friend Request', `${profile?.full_name || 'A classmate'} wants to connect with you!`);
    } catch { triggerToast('Failed to send request.'); }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await updateFriendRequestStatus(request.id, 'ACCEPTED');
      setRequests(p => p.filter(r => r.id !== request.id));
      setIncomingRequestIds(p => p.filter(id => id !== request.sender_id));
      setAcceptedFriendIds(p => [...p, request.sender_id]);
      const newFriend = classmates.find(c => c.id === request.sender_id);
      if (newFriend) setFriends(p => [...p, newFriend]);
      triggerToast('Request accepted!');
      sendPushNotification(request.sender_id, 'Friend Request Accepted', `${profile?.full_name || 'Your classmate'} accepted your friend request!`);
    } catch { triggerToast('Failed to accept request.'); }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const declined = requests.find(r => r.id === requestId);
      await deleteFriendRequest(requestId);
      if (declined) {
        setIncomingRequestIds(p => p.filter(id => id !== declined.sender_id));
        sendPushNotification(declined.sender_id, 'Friend Request Update', `${profile?.full_name || 'Your classmate'} couldn't connect right now.`);
      }
      setRequests(p => p.filter(r => r.id !== requestId));
      triggerToast('Request declined.');
    } catch { triggerToast('Failed to decline request.'); }
  };

  const filtered = (activeTab === 'FRIENDS' ? friends : classmates).filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.hobbies?.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile?.grade) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-secondary text-sm">Please set your grade in your profile to see classmates.</p>
      </div>
    );
  }

  const GRADE_BADGES = [
    'bg-primary-fixed text-on-primary-fixed-variant',
    'bg-secondary-fixed text-on-secondary-fixed-variant',
    'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  ];

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-8 px-4">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-on-surface text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-10">
        <h1 className="font-headline text-5xl text-on-surface mb-2">Community</h1>
        <p className="text-secondary font-medium italic text-base">Discover and connect with fellow luminaries in your field.</p>
      </header>

      {/* Tab bar + search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10">
        <div className="flex p-1 bg-surface-container-low rounded-xl w-fit">
          {(['EXPLORE', 'REQUESTS', 'FRIENDS'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary hover:text-on-surface'
              }`}>
              {tab === 'REQUESTS'
                ? `Requests${requests.length > 0 ? ` (${requests.length})` : ''}`
                : tab === 'FRIENDS'
                ? `Friends${friends.length > 0 ? ` (${friends.length})` : ''}`
                : 'Explore'}
            </button>
          ))}
        </div>
        <div className="relative max-w-md w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or hobby…"
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm rounded-[12px] focus:outline-none focus:ring-2 focus:ring-primary/20"
            style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center shadow-glow animate-pulse">
            <span className="material-symbols-outlined text-white text-[20px]">groups</span>
          </div>
        </div>

      ) : activeTab === 'REQUESTS' ? (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-[28px]">notifications</span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface mb-2">No pending requests</h3>
              <p className="text-secondary text-sm">When someone wants to connect, it'll show up here.</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-surface-container-lowest p-5 rounded-xl flex items-center justify-between gap-4"
                style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center font-bold text-secondary shrink-0">
                    {req.sender_avatar
                      ? <img src={req.sender_avatar} alt={req.sender_name} className="w-full h-full object-cover" />
                      : <span>{req.sender_name?.charAt(0) || '?'}</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{req.sender_name}</h4>
                    <p className="text-xs text-secondary">Sent a connection request</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleAcceptRequest(req)}
                    className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Accept">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </button>
                  <button onClick={() => handleDeclineRequest(req.id)}
                    className="p-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container transition-colors"
                    title="Decline">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-[28px]">
                  {activeTab === 'FRIENDS' ? 'person_check' : 'groups'}
                </span>
              </div>
              <h3 className="font-headline text-2xl text-on-surface mb-2">
                {activeTab === 'FRIENDS' ? 'No friends yet' : 'No classmates found'}
              </h3>
              <p className="text-secondary text-sm">
                {activeTab === 'FRIENDS' ? 'Connect with classmates to see them here!' : 'Be the first to invite your friends!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((person, idx) => {
                const badge = GRADE_BADGES[idx % GRADE_BADGES.length];
                const isFriend  = acceptedFriendIds.includes(person.id);
                const isSent    = sentRequestIds.includes(person.id);
                const isIncoming = incomingRequestIds.includes(person.id);

                return (
                  <div key={person.id} className="bg-surface-container-lowest p-6 rounded-xl hover:shadow-md transition-all"
                    style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
                    <div className="flex items-start justify-between mb-5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center font-bold text-lg text-secondary"
                          style={{ outline: '2px solid rgba(49,48,192,0.1)', outlineOffset: '2px' }}>
                          {person.avatar_url
                            ? <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
                            : person.full_name?.charAt(0) || '?'}
                        </div>
                        {isFriend && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full"
                            style={{ border: '2px solid white' }} />
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${badge}`}>
                        Grade {person.grade}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-on-surface mb-1">{person.full_name}</h3>
                    <p className="text-xs text-secondary mb-5 italic line-clamp-2">{person.hobbies || 'No hobbies listed'}</p>

                    {isFriend ? (
                      <div className="w-full py-2.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_check</span>
                        Friends
                      </div>
                    ) : isIncoming ? (
                      <button onClick={() => setActiveTab('REQUESTS')}
                        className="w-full py-2.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">notifications</span>
                        Respond
                      </button>
                    ) : isSent ? (
                      <div className="w-full py-2.5 rounded-lg text-outline font-bold text-sm flex items-center justify-center gap-2"
                        style={{ border: '2px solid rgba(199,196,216,0.5)' }}>
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        Request Sent
                      </div>
                    ) : (
                      <button onClick={() => handleSendRequest(person.id)}
                        className="w-full py-2.5 rounded-lg font-bold text-sm text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                        style={{ border: '2px solid #c85b32' }}>
                        Send Request
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Invite card */}
              <div className="bg-surface-container-low p-6 rounded-xl flex flex-col items-center justify-center gap-3 text-center opacity-70 hover:opacity-100 transition-opacity"
                style={{ border: '2px dashed rgba(199,196,216,0.5)' }}>
                <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-[22px]">person_add</span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-secondary">Invite classmate</h4>
                  <p className="text-[10px] text-secondary mt-1">Grow your academic circle</p>
                </div>
              </div>
            </div>
          )}

          {/* Featured section */}
          <section className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 relative h-56 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 primary-gradient opacity-90 z-10" />
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-center max-w-md">
                <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest w-fit px-3 py-1 rounded-full mb-4">
                  Event Highlight
                </span>
                <h2 className="font-headline text-3xl text-white mb-2">Weekend Deep-Work Sprints</h2>
                <p className="text-white/80 text-sm mb-5">Join classmates in group study sessions this Saturday.</p>
                <button className="bg-white text-primary px-5 py-2.5 rounded-full font-bold text-sm w-fit shadow-glow active:scale-95 transition-all">
                  Explore Sprints
                </button>
              </div>
            </div>
            <div className="bg-on-surface text-white p-7 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-xl mb-4">Recommended</h3>
                <div className="space-y-4">
                  {[
                    { icon: 'lightbulb', title: 'Study Circle', sub: `${classmates.length} classmates in your grade` },
                    { icon: 'diversity_2', title: 'The Archive Club', sub: 'Curated by Academic Luminaries' },
                  ].map(({ icon, title, sub }) => (
                    <div key={title} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-200 text-[18px]">{icon}</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold">{title}</div>
                        <div className="text-[10px] opacity-60">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="text-sm font-bold flex items-center gap-2 group mt-4">
                See all suggestions
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">arrow_forward</span>
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Community;
