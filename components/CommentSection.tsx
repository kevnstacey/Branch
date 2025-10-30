// components/CommentSection.tsx
import React, { useState, useRef, useEffect } from 'react';
import { User, CheckIn } from '../types';
import Avatar from './Avatar';
import { generateReplySuggestions } from '../services/geminiService';

interface CommentSectionProps {
  checkIn: CheckIn;
  currentUser: User;
  podMembers: User[];
  onAddComment: (checkInId: string, text: string) => void;
  disabled: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ checkIn, currentUser, podMembers, onAddComment, disabled }) => {
  const [newComment, setNewComment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const checkInOwner = podMembers.find(m => m.id === checkIn.userId);

  const handleAddComment = () => {
    if (newComment.trim() === '') return;
    onAddComment(checkIn.id, newComment);
    setNewComment('');
  };
  
  const handleSuggestReply = async () => {
    if (!checkInOwner) return;
    setIsSuggesting(true);
    setPopoverOpen(true);
    setSuggestions([]);
    try {
      const newSuggestions = await generateReplySuggestions(checkIn, currentUser);
      setSuggestions(newSuggestions);
    } catch(e) {
      console.error(e);
      setPopoverOpen(false);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setNewComment(suggestion);
    setPopoverOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
  return (
    <div className="mt-4 pt-4 border-t border-stone-200/80">
      <ul className="space-y-4">
        {checkIn.comments.map(comment => {
          const user = podMembers.find(m => m.id === comment.userId);
          if (!user) return null;
          return (
            <li key={comment.id} className="flex items-start space-x-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1">
                <div className="bg-stone-100 rounded-xl px-3 py-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-semibold text-sm text-stone-800">{user.name}</span>
                    <span className="text-xs text-stone-500">{timeSince(comment.timestamp)}</span>
                  </div>
                  <p className="text-sm text-stone-700">{comment.text}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-start space-x-3">
        <Avatar user={currentUser} size="sm" />
        <div className="flex-1 relative">
          <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={checkInOwner?.id === currentUser.id ? "Add a note..." : `Reply to ${checkInOwner?.name}...`}
              className="w-full pl-4 pr-12 py-2 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-stone-100"
              disabled={disabled}
            />
            {checkInOwner?.id !== currentUser.id && (
              <button
                ref={buttonRef}
                type="button"
                onClick={handleSuggestReply}
                disabled={isSuggesting || disabled}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-stone-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Suggest Reply with AI"
              >
                {isSuggesting ? (
                    <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <span className="text-lg">✨</span>
                )}
              </button>
            )}
             <button type="submit" className="hidden">Submit</button>
          </form>
          {isPopoverOpen && (
            <div ref={popoverRef} className="absolute bottom-full mb-2 w-full bg-white rounded-lg shadow-lg border border-stone-200 z-10 p-2 space-y-1">
              {isSuggesting && !suggestions.length && <p className="text-center text-sm text-stone-500 p-2">Thinking...</p>}
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left p-2 rounded-md text-sm text-stone-700 hover:bg-emerald-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
