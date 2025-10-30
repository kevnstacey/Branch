// components/ReactionBar.tsx
import React from 'react';
import { Reaction, User } from '../types';

interface ReactionBarProps {
  checkInId: string;
  reactions: Reaction[];
  currentUser: User;
  podMembers: User[];
  onAddReaction: (checkInId: string, emoji: string) => void;
  disabled: boolean;
}

const POPULAR_REACTIONS = ['👍', '💪', '🙌', '🎯', '💡'];

const ReactionBar: React.FC<ReactionBarProps> = ({ checkInId, reactions, currentUser, podMembers, onAddReaction, disabled }) => {
  
  const handleReactionClick = (emoji: string) => {
    if (disabled) return;
    onAddReaction(checkInId, emoji);
  };

  const reactionsByEmoji: { [key: string]: User[] } = {};
  reactions.forEach(reaction => {
    if (!reactionsByEmoji[reaction.emoji]) {
      reactionsByEmoji[reaction.emoji] = [];
    }
    const user = podMembers.find(m => m.id === reaction.userId);
    if (user) {
      reactionsByEmoji[reaction.emoji].push(user);
    }
  });

  return (
    <div className="mt-4 pt-3 flex items-center flex-wrap gap-x-2 gap-y-2">
      {Object.entries(reactionsByEmoji).map(([emoji, users]) => (
        <div key={emoji} className="relative group">
          <button 
            onClick={() => handleReactionClick(emoji)}
            className={`px-2.5 py-1 rounded-full text-sm flex items-center transition-colors ${users.some(u => u.id === currentUser.id) ? 'bg-emerald-600 text-white' : 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200/80'}`}
            disabled={disabled}
          >
            {emoji} <span className="ml-1.5 font-medium">{users.length}</span>
          </button>
          <div className="absolute bottom-full mb-2 w-max p-2 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {users.map(u => u.name).join(', ')}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-4px] w-2 h-2 bg-stone-800 rotate-45"></div>
          </div>
        </div>
      ))}

      <div className="flex items-center space-x-1 border-l border-stone-200/80 ml-2 pl-2">
        {POPULAR_REACTIONS.map(emoji => {
          const hasReactedWithThis = reactions.some(r => r.userId === currentUser.id && r.emoji === emoji);
          return (
            <button
              key={emoji}
              onClick={() => handleReactionClick(emoji)}
              title={`React with ${emoji}`}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-lg transition-all duration-150 transform hover:scale-110 ${hasReactedWithThis ? 'bg-emerald-200 ring-2 ring-emerald-400' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'} disabled:cursor-not-allowed disabled:opacity-50`}
              disabled={disabled}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  );
};

export default ReactionBar;
