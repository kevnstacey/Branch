// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PostCreator from './components/PostCreator';
import PodFeed from './components/PodFeed';
import PodMembers from './components/PodMembers';
import EveningCheckInModal from './components/EveningCheckInModal';
import InviteModal from './components/InviteModal';
import AccountabilityCalendar from './components/AccountabilityCalendar';
import { Pod, User, CheckIn, Notification } from './types';
import { generateEncouragement } from './services/geminiService';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';
import Login from './src/pages/Login';
import { supabase } from './src/integrations/supabase/client';
import {
  fetchPodData,
  ensureUserProfile,
  createNewPod,
  addCheckIn,
  updateCheckIn,
  addComment,
  addReaction,
  markAllNotificationsAsRead,
  // Removed inviteMemberToPod as it was unused in App.tsx
  fetchUserPods,
} from './src/services/supabaseService';

// Main application content component
const AuthenticatedAppContent: React.FC = () => {
  const { session } = useSession();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePod, setActivePod] = useState<Pod | null>(null);
  const [currentView, setCurrentView] = useState<'my-dashboard' | string>('my-dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [highlightedCheckInId, setHighlightedCheckInId] = useState<string | null>(null);
  
  const [eveningModalOpen, setEveningModalOpen] = useState(false);
  const [checkInToUpdate, setCheckInToUpdate] = useState<CheckIn | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [pushedGoals, setPushedGoals] = useState<string[]>([]);

  const [usageCount, setUsageCount] = useState<number>(() => {
    return parseInt(sessionStorage.getItem('branchUsageCount') || '0', 10);
  });

  const incrementUsage = () => {
    setUsageCount(prev => {
      const newCount = prev + 1;
      sessionStorage.setItem('branchUsageCount', newCount.toString());
      return newCount;
    });
  };

  const limitReached = usageCount >= 10;

  // Fetch user profile and pods on session change
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        const appUser = await ensureUserProfile(session.user);
        setCurrentUser(appUser);

        const pods = await fetchUserPods(appUser.id);

        if (pods.length > 0) {
          // For now, just pick the first pod. In a real app, user would select.
          const fullPodData = await fetchPodData(pods[0].id, appUser.id);
          setActivePod(fullPodData);
        } else {
          // If no pods, create a default one for the user
          const newPod = await createNewPod(`${appUser.name}'s Pod`, appUser.id);
          if (newPod) {
            const fullPodData = await fetchPodData(newPod.id, appUser.id);
            setActivePod(fullPodData);
          }
        }
      }
    };
    loadUserData();
  }, [session]);

  // Real-time subscription for active pod data
  useEffect(() => {
    if (!activePod?.id || !currentUser?.id) return;

    const channel = supabase
      .channel(`pod:${activePod.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins', filter: `pod_id=eq.${activePod.id}` }, payload => {
        console.log('Change received!', payload);
        // Refetch pod data to ensure all nested relations are updated
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `check_ins.pod_id=eq.${activePod.id}` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `check_ins.pod_id=eq.${activePod.id}` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions', filter: `check_ins.pod_id=eq.${activePod.id}` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `target_user_id=eq.${currentUser.id}` }, payload => {
        console.log('Notification change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePod?.id, currentUser?.id]);


  const handleViewChange = (view: 'my-dashboard' | string) => {
    setCurrentView(view);
    setSelectedDate(null); // Reset date filter when changing views
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };
  
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!activePod || !currentUser) return;

    // Mark notification as read in DB
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    if (error) {
      console.error('Error marking notification as read:', error);
    }

    // Refetch pod data to update notification status in UI
    const updatedPod = await fetchPodData(activePod.id, currentUser.id);
    if (updatedPod) setActivePod(updatedPod);

    // Determine which dashboard to switch to
    const targetCheckIn = activePod.checkIns.find(c => c.id === notification.checkInId);
    if (!targetCheckIn) return;

    const targetView = targetCheckIn.userId === currentUser.id ? 'my-dashboard' : targetCheckIn.userId;
    setCurrentView(targetView);
    
    // Highlight the check-in
    setHighlightedCheckInId(notification.checkInId);
    setTimeout(() => {
        const element = document.getElementById(`checkin-${notification.checkInId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedCheckInId(null), 3000);
  }, [activePod, currentUser]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!currentUser || !activePod) return;
    await markAllNotificationsAsRead(currentUser.id);
    const updatedPod = await fetchPodData(activePod.id, currentUser.id);
    if (updatedPod) setActivePod(updatedPod);
  }, [currentUser, activePod]);

  const handleAddCheckIn = useCallback(async (focus: string, goals: { text: string; attachment?: File }[]) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();

    const newCheckIn = await addCheckIn(currentUser.id, activePod.id, focus, goals);
    if (newCheckIn) {
      // AI generates an encouragement comment from another user
      setTimeout(async () => {
          try {
              const encouragementText = await generateEncouragement(currentUser, newCheckIn);
              // Find a podmate who is not the current user
              const friendlyPodmate = activePod.members.find(m => m.id !== currentUser.id) || activePod.members[0];
              
              if (friendlyPodmate && newCheckIn.id) {
                await addComment(newCheckIn.id, friendlyPodmate.id, encouragementText, currentUser.id);
              }
          } catch (error) { console.error("Failed to generate encouragement:", error); }
      }, 2500);
    }
    setPushedGoals([]); // Clear pushed goals after using them
  }, [limitReached, currentUser, activePod, incrementUsage]);

  const handleUpdateCheckIn = useCallback(async (updatedCheckIn: CheckIn, pushedGoalsForTomorrow: string[]) => {
    if (!activePod) return;
    const result = await updateCheckIn(updatedCheckIn.id, updatedCheckIn.goals, updatedCheckIn.eveningRecap || '');
    if (result) {
      setEveningModalOpen(false);
      setPushedGoals(pushedGoalsForTomorrow);
    }
  }, [activePod]);
  
  const handleAddComment = useCallback(async (checkInId: string, text: string) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();
    const targetCheckIn = activePod.checkIns.find(ci => ci.id === checkInId);
    if (targetCheckIn) {
      await addComment(checkInId, currentUser.id, text, targetCheckIn.userId);
    }
  }, [limitReached, currentUser, activePod, incrementUsage]);

  const handleAddReaction = useCallback(async (checkInId: string, emoji: string) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();
    const targetCheckIn = activePod.checkIns.find(ci => ci.id === checkInId);
    if (targetCheckIn) {
      await addReaction(checkInId, currentUser.id, emoji, targetCheckIn.userId);
    }
  }, [limitReached, currentUser, activePod, incrementUsage]);

  const feedKey = `${currentView}-${selectedDate?.getTime()}-${activePod?.id}`;

  if (!currentUser || !activePod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <svg className="animate-spin h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen font-sans text-stone-900">
      <Header
        activePod={activePod}
        currentUser={currentUser}
        onViewChange={handleViewChange}
        currentView={currentView}
        onNotificationClick={handleNotificationClick}
        notifications={activePod.notifications.filter(n => activePod.members.some(m => m.id === n.fromUserId))}
        onMarkAllAsRead={handleMarkAllAsRead}
        onInvite={() => setInviteModalOpen(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            {currentView === 'my-dashboard' && (
              <>
                <PostCreator 
                  currentUser={currentUser} 
                  onAddCheckIn={handleAddCheckIn}
                  pushedGoals={pushedGoals}
                  disabled={limitReached}
                  checkInHistory={activePod.checkIns.filter(c => c.userId === currentUser.id)}
                  onAiAction={incrementUsage}
                />
                {limitReached && (
                  <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">Demo Limit Reached</p>
                    <p className="text-sm">You have reached the 10-action limit for this demo session.</p>
                    <p className="text-sm mt-2">
                      If you would like to learn more, contact Kevin at <a href="mailto:kevin@ravenusdigitalmedia.com" className="font-semibold underline">kevin@ravenusdigitalmedia.com</a> or <a href="https://tidycal.com/kevindavidson2668/15-minute-meeting" target="_blank" rel="noopener noreferrer" className="font-semibold underline">book a meeting</a>.
                    </p>
                  </div>
                )}
              </>
            )}
            <PodFeed
              key={feedKey}
              feedKey={feedKey}
              checkIns={activePod.checkIns}
              members={activePod.members}
              currentUser={currentUser}
              filter={currentView === 'my-dashboard' ? 'my-inbox' : 'user'}
              viewUserId={currentView === 'my-dashboard' ? currentUser.id : currentView}
              selectedDate={selectedDate}
              highlightedCheckInId={highlightedCheckInId}
              onOpenEveningModal={(checkIn) => { setCheckInToUpdate(checkIn); setEveningModalOpen(true); }}
              onAddComment={handleAddComment}
              onAddReaction={handleAddReaction}
              disabled={limitReached}
            />
          </div>
          
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <PodMembers
              members={activePod.members}
              onInvite={() => setInviteModalOpen(true)}
              currentUser={currentUser}
              onSelectUser={handleViewChange}
              currentView={currentView}
            />
             <AccountabilityCalendar
                checkIns={activePod.checkIns}
                members={activePod.members}
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                pushedGoalsCount={pushedGoals.length}
             />
          </aside>
          
        </div>
      </main>
      <EveningCheckInModal 
        isOpen={eveningModalOpen}
        onClose={() => setEveningModalOpen(false)}
        checkIn={checkInToUpdate}
        onUpdateCheckIn={handleUpdateCheckIn}
      />
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        podName={activePod.name}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SessionContextProvider>
      <AuthWrapper />
    </SessionContextProvider>
  );
};

const AuthWrapper: React.FC = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <svg className="animate-spin h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  return session ? <AuthenticatedAppContent /> : <Login />;
};

export default App;