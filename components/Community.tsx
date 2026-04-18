import React, { useState, useEffect } from 'react';
import { UserProfile, FriendRequest } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendFriendRequest, getFriendRequests, updateFriendRequestStatus, deleteFriendRequest } from '../services/db';
import { sendPushNotification } from '../services/notifications';
import { Users, UserPlus, Loader2, Search, Bell, Check, X, MessageSquare, UserCheck } from 'lucide-react';

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
  const [declineReason, setDeclineReason] = useState<{ [key: string]: string }>({});
  const [showDeclineInput, setShowDeclineInput] = useState<string | null>(null);
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([]);
  const [incomingRequestIds, setIncomingRequestIds] = useState<string[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchData = async () => {
    if (!user || !profile?.grade) return;
    setLoading(true);
    
    try {
      // Fetch classmates — only select columns needed for the UI (never fetch email of other users)
      const { data: classmatesData, error: classmatesError } = await supabase
        .from('profiles')
        .select('id, full_name, grade, avatar_url, hobbies')
        .eq('grade', profile.grade)
        .neq('id', user.id);
      
      if (classmatesError) throw classmatesError;
      setClassmates(classmatesData || []);

      // Fetch all requests involving the user
      const { data: allReqs, error: reqsError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      
      if (reqsError) throw reqsError;

      if (allReqs) {
        const sent = allReqs.filter(r => r.sender_id === user.id && r.status === 'PENDING').map(r => r.receiver_id);
        const incoming = allReqs.filter(r => r.receiver_id === user.id && r.status === 'PENDING').map(r => r.sender_id);
        const acceptedIds = allReqs.filter(r => r.status === 'ACCEPTED').map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
        
        setSentRequestIds(sent);
        setIncomingRequestIds(incoming);
        setAcceptedFriendIds(acceptedIds);
        
        // Populate friends list
        const friendsList = classmatesData?.filter(c => acceptedIds.includes(c.id)) || [];
        setFriends(friendsList);

        // Populate pending requests for the UI
        setRequests(allReqs.filter(r => r.receiver_id === user.id && r.status === 'PENDING').map(req => ({
          ...req,
          sender_name: classmatesData?.find(c => c.id === req.sender_id)?.full_name || 'Classmate',
          sender_avatar: classmatesData?.find(c => c.id === req.sender_id)?.avatar_url
        })) as FriendRequest[]);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, profile]);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSendRequest = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendFriendRequest(user.id, receiverId);
      setSentRequestIds(prev => [...prev, receiverId]);
      triggerToast('Friend request sent!');
      // Notify the receiver
      sendPushNotification(
        receiverId,
        'New Friend Request',
        `${profile?.full_name || 'A classmate'} wants to connect with you!`
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      triggerToast('Failed to send request.');
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await updateFriendRequestStatus(request.id, 'ACCEPTED');

      // Update local states immediately
      setRequests(prev => prev.filter(r => r.id !== request.id));
      setIncomingRequestIds(prev => prev.filter(id => id !== request.sender_id));
      setAcceptedFriendIds(prev => [...prev, request.sender_id]);

      // Add to friends list
      const newFriend = classmates.find(c => c.id === request.sender_id);
      if (newFriend) {
        setFriends(prev => [...prev, newFriend]);
      }

      triggerToast('Request accepted!');
      // Notify the original sender
      sendPushNotification(
        request.sender_id,
        'Friend Request Accepted',
        `${profile?.full_name || 'Your classmate'} accepted your friend request!`
      );
    } catch (error) {
      console.error('Error accepting friend request:', error);
      triggerToast('Failed to accept request.');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const declinedReq = requests.find(r => r.id === requestId);
      await deleteFriendRequest(requestId);

      // Update local state
      if (declinedReq) {
        setIncomingRequestIds(prev => prev.filter(id => id !== declinedReq.sender_id));
        // Notify the sender
        sendPushNotification(
          declinedReq.sender_id,
          'Friend Request Update',
          `${profile?.full_name || 'Your classmate'} couldn't connect right now.`
        );
      }
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setShowDeclineInput(null);
      triggerToast('Request declined.');
    } catch (error) {
      console.error('Error declining friend request:', error);
      triggerToast('Failed to decline request.');
    }
  };

  const filteredClassmates = classmates.filter(c => 
    c.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.hobbies?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFriends = friends.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile?.grade) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Please set your grade in your profile to see classmates.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500 relative">
      {showToast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right duration-300">
          <Check className="w-5 h-5 text-green-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-500" />
            Class {profile.grade} Community
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Connect with other students in your grade.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('EXPLORE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'EXPLORE' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setActiveTab('FRIENDS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'FRIENDS' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Friends
            {friends.length > 0 && (
              <span className="bg-primary-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {friends.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Requests
            {requests.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {(activeTab === 'EXPLORE' || activeTab === 'FRIENDS') && (
        <div className="mb-6 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'EXPLORE' ? "Search classmates..." : "Search friends..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : activeTab === 'EXPLORE' ? (
        filteredClassmates.length === 0 ? (
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
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-2">Class {classmate.grade}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-10">
                  {classmate.hobbies || "No hobbies listed yet."}
                </p>
                
                {acceptedFriendIds.includes(classmate.id) ? (
                  <div className="w-full py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium rounded-lg flex items-center justify-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Friends
                  </div>
                ) : incomingRequestIds.includes(classmate.id) ? (
                  <button 
                    onClick={() => setActiveTab('REQUESTS')}
                    className="w-full py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-medium rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Respond
                  </button>
                ) : (
                  <button 
                    disabled={sentRequestIds.includes(classmate.id)}
                    onClick={() => handleSendRequest(classmate.id)}
                    className={`w-full py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      sentRequestIds.includes(classmate.id)
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                    }`}
                  >
                    {sentRequestIds.includes(classmate.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'FRIENDS' ? (
        filteredFriends.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No friends yet</h3>
            <p className="text-slate-500 mt-1">Connect with classmates to see them here!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map(friend => (
              <div key={friend.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 overflow-hidden">
                  {friend.avatar_url ? (
                    <img src={friend.avatar_url} alt={friend.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                      {friend.full_name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">{friend.full_name}</h3>
                <p className="text-xs text-slate-500 mb-2">{friend.hobbies || "Classmate"}</p>
                <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                  Friend
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No pending requests</h3>
              <p className="text-slate-500 mt-1">When someone wants to connect, it will show up here.</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {req.sender_avatar ? (
                        <img src={req.sender_avatar} alt={req.sender_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                          {req.sender_name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{req.sender_name}</h4>
                      <p className="text-xs text-slate-500">Sent a connection request</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleAcceptRequest(req)}
                      className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 transition-colors"
                      title="Accept"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setShowDeclineInput(showDeclineInput === req.id ? null : req.id)}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors"
                      title="Decline"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {showDeclineInput === req.id && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Reason for declining (optional)..."
                          value={declineReason[req.id] || ''}
                          onChange={e => setDeclineReason({ ...declineReason, [req.id]: e.target.value })}
                          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>
                      <button 
                        onClick={() => handleDeclineRequest(req.id)}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Community;
