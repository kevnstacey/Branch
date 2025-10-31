// App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PostCreator from './components/PostCreator';
import PodFeed from './components/PodFeed';
import PodMembers from './components/PodMembers';
import EveningCheckInModal from './components/EveningCheckInModal';
import InviteModal from './components/InviteModal';
import AccountabilityCalendar from './components/AccountabilityCalendar';
import { demoPods } from './services/demoData';
import { Pod, User, CheckIn, GoalStatus, Notification, Reaction, Comment, FeedGoal } from './types';
import { generateEncouragement } from './services/geminiService';

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


const App: React.FC = () => {
  const [pods, setPods] = useState<{ [key: string]: Pod }>(demoPods);
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

  const activePodId = 'p1'; // Hardcoded to the main pod as per new requirement
  const activePod = pods[activePodId];
  const currentUser = activePod.members[0]; // Assuming the first member is the current user

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
            const friendlyPodmate = activePod.members.find(m => m.id !== currentUser.id) || activePod.members[1];
            
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
// FIX: Pass the `feedKey` prop to the PodFeed component to be used for animations.
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
            {/* FIX: Pass missing props (`currentUser`, `onSelectUser`, `currentView`) to the PodMembers component. */}
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

export default App;