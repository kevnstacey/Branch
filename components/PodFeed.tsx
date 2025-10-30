// components/PodFeed.tsx
import React, { useEffect, useState } from 'react';
import { CheckIn, User } from '../types';
import CheckInCard from './CheckInCard';

interface PodFeedProps {
  checkIns: CheckIn[];
  members: User[];
  currentUser: User;
  filter: 'my-inbox' | 'user' | 'all';
  viewUserId?: string; // ID of the user whose dashboard is being viewed
  selectedDate?: Date | null;
  highlightedCheckInId: string | null;
  onOpenEveningModal: (checkIn: CheckIn) => void;
  onAddComment: (checkInId: string, text: string) => void;
  onAddReaction: (checkInId: string, emoji: string) => void;
  disabled: boolean;
  feedKey: string; // Used to trigger animations
}

const PodFeed: React.FC<PodFeedProps> = ({
  checkIns,
  members,
  currentUser,
  filter,
  viewUserId,
  selectedDate,
  highlightedCheckInId,
  onOpenEveningModal,
  onAddComment,
  onAddReaction,
  disabled,
  feedKey
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This creates the fade-in effect when the feed's data changes
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50); // Short delay to allow CSS transition
    return () => clearTimeout(timer);
  }, [feedKey]);

  const sortedCheckIns = [...checkIns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredCheckIns = sortedCheckIns.filter(checkIn => {
    // Date filter is always applied first
    if (selectedDate && new Date(checkIn.timestamp).toDateString() !== selectedDate.toDateString()) {
      return false;
    }

    // Then apply the main view filter
    switch (filter) {
      case 'user':
        return checkIn.userId === viewUserId;
      case 'my-inbox':
        // Show my posts, or posts I've commented on or reacted to
        return checkIn.userId === currentUser.id ||
               checkIn.comments.some(c => c.userId === currentUser.id) ||
               checkIn.reactions.some(r => r.userId === currentUser.id);
      case 'all':
      default:
        return true;
    }
  });

  const EmptyState = () => (
    <div className="text-center py-12 bg-white rounded-xl shadow-md border border-stone-200/80">
      <h3 className="text-lg font-medium text-stone-700">The feed is quiet...</h3>
      {filter === 'my-inbox' && (
        <p className="mt-1 text-sm text-stone-500">
          Welcome to your Branch, {currentUser.name}! This is your space.<br />
          Start your journey by setting your first morning intention above.
        </p>
      )}
       {filter !== 'my-inbox' && !selectedDate && (
        <p className="mt-1 text-sm text-stone-500">No check-ins yet for this view.</p>
      )}
      {selectedDate && (
        <p className="mt-1 text-sm text-stone-500">No activity recorded for this day.</p>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {filteredCheckIns.length > 0 ? (
        filteredCheckIns.map(checkIn => (
          <CheckInCard
            key={checkIn.id}
            checkIn={checkIn}
            currentUser={currentUser}
            podMembers={members}
            isHighlighted={highlightedCheckInId === checkIn.id}
            onOpenEveningModal={onOpenEveningModal}
            onAddComment={onAddComment}
            onAddReaction={onAddReaction}
            disabled={disabled}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default PodFeed;
