// App.tsx
import React from 'react';
import Header from './components/Header';
import PostCreator from './components/PostCreator';
import PodFeed from './components/PodFeed';
import PodMembers from './components/PodMembers';
import EveningCheckInModal from './components/EveningCheckInModal';
import InviteModal from './components/InviteModal';
import AccountabilityCalendar from './components/AccountabilityCalendar';
import { useSession } from './src/components/SessionContextProvider'; // Removed SessionContextProvider import
import Login from './src/pages/Login';
import { usePodData } from './src/hooks/usePodData';
import { Notification, User, CheckIn } from './types';

// Main application content component
const AuthenticatedAppContent: React.FC = () => {
  const { session } = useSession();
  const {
    currentUser,
    activePod,
    currentView,
    selectedDate,
    highlightedCheckInId,
    eveningModalOpen,
    checkInToUpdate,
    inviteModalOpen,
    pushedGoals,
    limitReached,
    handleViewChange,
    handleDateSelect,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleAddCheckIn,
    handleUpdateCheckIn,
    handleAddComment,
    handleAddReaction,
    setInviteModalOpen,
    setEveningModalOpen,
    setCheckInToUpdate,
    incrementUsage, // Destructure incrementUsage from the hook
  } = usePodData({ session });

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
        notifications={activePod.notifications.filter((n: Notification) => activePod.members.some((m: User) => m.id === n.fromUserId))}
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
                  checkInHistory={activePod.checkIns.filter((c: CheckIn) => c.userId === currentUser.id)}
                  onAiAction={incrementUsage} // Pass incrementUsage directly
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