// components/CheckInCard.tsx
import React from 'react';
import { CheckIn, User } from '../types';
import Avatar from './Avatar';
import ReactionBar from './ReactionBar';
import CommentSection from './CommentSection';
import Button from './Button';

interface CheckInCardProps {
  checkIn: CheckIn;
  currentUser: User;
  podMembers: User[];
  isHighlighted: boolean;
  onOpenEveningModal: (checkIn: CheckIn) => void;
  onAddComment: (checkInId: string, text: string) => void;
  onAddReaction: (checkInId: string, emoji: string) => void;
  disabled: boolean;
}

const CheckInCard: React.FC<CheckInCardProps> = ({ checkIn, currentUser, podMembers, isHighlighted, onOpenEveningModal, onAddComment, onAddReaction, disabled }) => {
  const user = podMembers.find(m => m.id === checkIn.userId);

  if (!user) return null;

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return "just now";
  };

  const isToday = new Date(checkIn.timestamp).toDateString() === new Date().toDateString();
  const showEveningButton = checkIn.userId === currentUser.id && checkIn.type === 'morning' && isToday;

  return (
    <div id={`checkin-${checkIn.id}`} className={`bg-white rounded-xl shadow-md border ${isHighlighted ? 'border-emerald-500 ring-2 ring-emerald-500/50 animate-[pulse_1.5s_ease-out_infinite]' : 'border-stone-200/80'} transition-all duration-300`}>
      <div className="p-5">
        <div className="flex items-center space-x-3">
          <Avatar user={user} size="md" />
          <div>
            <p className="font-semibold text-stone-800">{user.name}</p>
            <p className="text-sm text-stone-500">{timeSince(checkIn.timestamp)}</p>
          </div>
        </div>
        <div className="mt-4 pl-1 space-y-3">
          <p className="text-stone-600">
            <span className="font-semibold text-stone-800">Focus:</span> {checkIn.focus}
          </p>
          
          <ul className="space-y-2">
            {checkIn.goals.map((goal, index) => (
              <li key={index} className="flex items-start text-sm">
                <span className="mr-2 text-lg pt-0.5">{goal.status === 'Done' ? '✅' : goal.status === 'Partial' ? '🌗' : '➡️'}</span>
                <div className="flex-1">
                    <span className={`text-stone-700 ${goal.status === 'Skipped' ? 'line-through text-stone-500' : ''}`}>{goal.text}</span>
                    {goal.attachment && (
                        goal.attachment.type.startsWith('image/') ? (
                            <div className="mt-2">
                                <a href={goal.attachment.url} target="_blank" rel="noopener noreferrer" className="inline-block">
                                <img src={goal.attachment.url} alt={goal.attachment.name} className="max-h-32 max-w-full rounded-lg border border-stone-200 object-cover" />
                                </a>
                            </div>
                        ) : (
                            <div className="mt-2">
                                <a
                                    href={goal.attachment.url}
                                    download={goal.attachment.name}
                                    className="flex items-center space-x-2 bg-stone-100 hover:bg-stone-200 transition-colors p-2 rounded-lg text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-stone-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-stone-700 truncate">{goal.attachment.name}</p>
                                    </div>
                                </a>
                            </div>
                        )
                    )}
                </div>
              </li>
            ))}
          </ul>

          {checkIn.type === 'evening' && checkIn.eveningRecap && (
            <div className="mt-3 p-3 bg-emerald-50/70 rounded-lg">
              <p className="text-sm text-stone-800 font-semibold mb-1">Evening Recap:</p>
              <p className="text-sm text-stone-700 italic">"{checkIn.eveningRecap}"</p>
            </div>
          )}

          {showEveningButton && (
            <div className="pt-2">
              <Button onClick={() => onOpenEveningModal(checkIn)} variant="secondary" className="w-full" disabled={disabled}>
                🌙 Complete Your Evening Reflection
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-4">
        <ReactionBar
          checkInId={checkIn.id}
          reactions={checkIn.reactions}
          currentUser={currentUser}
          podMembers={podMembers}
          onAddReaction={onAddReaction}
          disabled={disabled}
        />
        <CommentSection
          checkIn={checkIn}
          currentUser={currentUser}
          podMembers={podMembers}
          onAddComment={onAddComment}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default CheckInCard;