// App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PostCreator from './components/PostCreator';
import PodFeed from './components/PodFeed';
import PodMembers from './components/PodMembers';
import EveningCheckInModal from './components/EveningCheckInModal';
import InviteModal from './components/InviteModal';
import AccountabilityCalendar from './components/AccountabilityCalendar';
import { demoPods } from './services/demoData'; // Keep for initial structure, will be replaced
import { Pod, User, CheckIn, GoalStatus, Notification, Reaction, Comment, FeedGoal } from './types';
import { generateEncouragement } from './services/geminiService';
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';
import Login from './src/pages/Login';
import { supabase } from './src/integrations/supabase/client';

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Main application content component
const AuthenticatedAppContent: React.FC = () => {
  const { session } = useSession();
  const [pods, setPods] = useState<{ [key: string]: Pod }>(demoPods); // Will be replaced with fetched data
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

  // Placeholder for current user and active pod until fetched from Supabase
  const activePodId = 'p1'; // Hardcoded to the main pod for now
  const activePod = pods[activePodId];
  
  // Derive currentUser from session or use a placeholder
  const currentUser: User = session?.user ? {
    id: session.user.id,
    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    avatar: session.user.user_metadata.photo_url || session.user.user_metadata.avatar_url || '👤', // Use photo_url from Supabase metadata
  } : { id: 'guest', name: 'Guest', email: '', avatar: '👤' };


  const incrementUsage = () => {
    setUsageCount(prev => {
      const newCount = prev + 1;
      sessionStorage.setItem('branchUsageCount', newCount.toString());
      return newCount;
    });
  };

  const limitReached = usageCount >= 10;

  const handleViewChange = (view: 'my-dashboard' | string) => {
    setCurrentView(view);
    setSelectedDate(null); // Reset date filter when changing views
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };
  
  const handleNotificationClick = (notification: Notification) => {
    const targetCheckIn = activePod.checkIns.find(c => c.id === notification.checkInId);
    if (!targetCheckIn) return;

    // Determine which dashboard to switch to
    const targetView = targetCheckIn.userId === currentUser.id ? 'my-dashboard' : targetCheckIn.userId;
    setCurrentView(targetView);
    
    // Mark notification as read
    setPods(prev => {
        const newPods = { ...prev };
        const notif = newPods[activePodId].notifications.find(n => n.id === notification.id);
        if(notif) notif.read = true;
        return newPods;
    });

    // Highlight the check-in
    setHighlightedCheckInId(notification.checkInId);
    setTimeout(() => {
        const element = document.getElementById(`checkin-${notification.checkInId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedCheckInId(null), 3000);
  };

  const handleMarkAllAsRead = () => {
      setPods(prev => {
          const newPods = { ...prev };
          newPods[activePodId].notifications.forEach(n => n.read = true);
          return newPods;
      });
  };

  const handleAddCheckIn = async (focus: string, goals: { text: string; attachment?: File }[]) => {
    if (limitReached) return;
    incrementUsage();

    const processedGoals: FeedGoal[] = await Promise.all(
      goals.map(async (g) => {
        let attachmentData;
        if (g.attachment) {
          try {
            attachmentData = {
              name: g.attachment.name,
              type: g.attachment.type,
              url: await fileToDataUrl(g.attachment),
            };
          } catch (error) {
            console.error("Error converting file to data URL:", error);
            attachmentData = undefined;
          }
        }
        return {
          text: g.text,
          status: GoalStatus.Partial,
          attachment: attachmentData,
        };
      })
    );

    const newCheckIn: CheckIn = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      type: 'morning',
      focus,
      goals: processedGoals,
      comments: [],
      reactions: [],
    };
    
    setPods(prev => ({
        ...prev,
        [activePodId]: {
            ...prev[activePodId],
            checkIns: [newCheckIn, ...prev[activePodId].checkIns],
        },
    }));

    // AI generates an encouragement comment from another user
    setTimeout(async () => {
        try {
            const encouragementText = await generateEncouragement(currentUser, newCheckIn);
            // Find a podmate who is not the current user
            const friendlyPodmate = activePod.members.find(m => m.id !== currentUser.id) || activePod.members[0]; // Fallback to current user if no other members
            
            const aiComment: Comment = {
                id: `comment-${Date.now()}`,
                userId: friendlyPodmate.id,
                text: encouragementText,
                timestamp: new Date().toISOString(),
            };
            
            setPods(prev => {
                const newPods = { ...prev };
                const checkIn = newPods[activePodId].checkIns.find(c => c.id === newCheckIn.id);
                if (checkIn) checkIn.comments.push(aiComment);
                return newPods;
            });

        } catch (error) { console.error("Failed to generate encouragement:", error); }
    }, 2500);

    setPushedGoals([]); // Clear pushed goals after using them
  };

  const handleUpdateCheckIn = (updatedCheckIn: CheckIn, pushedGoalsForTomorrow: string[]) => {
      setPods(prev => ({
          ...prev,
          [activePodId]: {
              ...prev[activePodId],
              checkIns: prev[activePodId].checkIns.map(c => c.id === updatedCheckIn.id ? updatedCheckIn : c),
          },
      }));
      setEveningModalOpen(false);
      setPushedGoals(pushedGoalsForTomorrow);
  };
  
  const handleAddComment = (checkInId: string, text: string) => {
    if (limitReached) return;
    incrementUsage();
    const newComment: Comment = { id: `comment-${Date.now()}`, userId: currentUser.id, text, timestamp: new Date().toISOString() };
    setPods(prev => {
        const newPods = { ...prev };
        const checkIn = newPods[activePodId].checkIns.find(c => c.id === checkInId);
        if (checkIn) checkIn.comments.push(newComment);
        return newPods;
    });
  };

  const handleAddReaction = (checkInId: string, emoji: string) => {
    if (limitReached) return;
    incrementUsage();
    setPods(prev => {
        const newPods = { ...prev };
        const checkIn = newPods[activePodId].checkIns.find(c => c.id === checkInId);
        if (checkIn) {
            const userReactionIndex = checkIn.reactions.findIndex(r => r.userId === currentUser.id);
            if (userReactionIndex > -1) {
                if(checkIn.reactions[userReactionIndex].emoji === emoji) { // Toggling off
                    checkIn.reactions.splice(userReactionIndex, 1);
                } else { // Changing reaction
                    checkIn.reactions[userReactionIndex].emoji = emoji;
                }
            } else { // Adding new reaction
                checkIn.reactions.push({ userId: currentUser.id, emoji });
            }
        }
        return newPods;
    });
  };

  const feedKey = `${currentView}-${selectedDate?.getTime()}`;

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
              onAddReaction={onAddReaction}
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