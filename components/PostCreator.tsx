// components/PostCreator.tsx
import React, { useState, useEffect } from 'react';
import { User, CheckIn } from '../types';
import Button from './Button';
import Avatar from './Avatar';
import { generateFocusSuggestions, generateGoalSuggestions } from '../services/geminiService';
import SuggestionModal from './SuggestionModal';
import TextArea from './TextArea';
import InputField from './InputField';

interface PostCreatorProps {
  currentUser: User;
  onAddCheckIn: (focus: string, goals: { text: string; attachment?: File }[]) => void;
  pushedGoals: string[];
  disabled?: boolean;
  checkInHistory: CheckIn[];
  onAiAction: () => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ currentUser, onAddCheckIn, pushedGoals, disabled, checkInHistory, onAiAction }) => {
  const [focus, setFocus] = useState('');
  const [goals, setGoals] = useState<{ id: number; text: string; attachment?: File }[]>([]);
  const [nextGoalId, setNextGoalId] = useState(1);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', description: '', suggestions: [] as string[], onSelect: (s: string) => {} });

  // Initialize or reset goals
  const initializeGoals = (initialGoals: string[] = []) => {
    let newGoals = initialGoals.map((text, index) => ({ id: index, text, attachment: undefined }));
    while (newGoals.length < 3) {
      newGoals.push({ id: newGoals.length, text: '', attachment: undefined });
    }
    setGoals(newGoals);
    setNextGoalId(newGoals.length);
  };

  useEffect(() => {
    initializeGoals(pushedGoals);
  }, [pushedGoals]);
  
  const handleUpdateGoal = (id: number, text: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, text } : g));
  };

  const handleAddGoalField = () => {
    setGoals(prevGoals => [...prevGoals, { id: nextGoalId, text: '', attachment: undefined }]);
    setNextGoalId(prevId => prevId + 1);
  };

  const handleFileChange = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File is too large. Please select a file smaller than 5MB.");
        return;
      }
      setGoals(goals.map(g => g.id === id ? { ...g, attachment: file } : g));
    }
  };
  
  const handleRemoveAttachment = (id: number) => {
    setGoals(goals.map(g => g.id === id ? { ...g, attachment: undefined } : g));
  };
  
  const handlePost = () => {
    const validGoals = goals
      .filter(g => g.text.trim() !== '')
      .map(g => ({ text: g.text, attachment: g.attachment }));

    if (!focus.trim() || validGoals.length === 0) {
        alert("Please set a focus and at least one goal.");
        return;
    };
    onAddCheckIn(focus, validGoals);
    setFocus('');
    initializeGoals(); // Reset goals to empty state
  };

  const openSuggestionModal = async (type: 'focus' | 'goal', goalIdToUpdate?: number) => {
      onAiAction();
      setIsGenerating(true);
      setModalOpen(true);
      
      let title = '', description = '', suggestions: string[] = [];
      let onSelect = (s: string) => {};
      
      try {
        if (type === 'focus') {
            title = 'AI Focus Suggestions';
            description = 'Based on your recent activity.';
            onSelect = (s) => setFocus(s);
            setModalContent({ title, description, suggestions, onSelect }); // Show loading state
            suggestions = await generateFocusSuggestions(checkInHistory);
        } else {
            if (!focus) {
              alert("Please set a focus first to get goal suggestions.");
              setIsGenerating(false);
              setModalOpen(false);
              return;
            }
            title = 'AI Goal Suggestions';
            description = `For your focus: "${focus}"`;
            onSelect = (s) => {
              if (goalIdToUpdate !== undefined) {
                handleUpdateGoal(goalIdToUpdate, s);
              }
            };
            setModalContent({ title, description, suggestions, onSelect }); // Show loading state
            suggestions = await generateGoalSuggestions(focus);
        }
        
        setModalContent({ title, description, suggestions, onSelect });
      } catch (error) {
          console.error(`Error generating ${type} suggestions:`, error);
          setModalOpen(false); // Close modal on error
      } finally {
        setIsGenerating(false);
      }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    modalContent.onSelect(suggestion);
    setModalOpen(false);
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-stone-200/80">
        <SuggestionModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            suggestions={modalContent.suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            title={modalContent.title}
            description={modalContent.description}
            isLoading={isGenerating}
        />
        <div className="flex items-center space-x-3 mb-4">
            <Avatar user={currentUser} />
            <div>
                <h2 className="text-lg font-semibold text-stone-800">Morning Intention</h2>
                <p className="text-sm text-stone-500">What's your focus for today, {currentUser.name}?</p>
            </div>
        </div>
        <div className="space-y-4">
            <div className="relative">
                <TextArea
                    label="Today's Main Focus"
                    id="focus-input"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g., Finalize the Q3 report, Deep work on the new feature"
                    rows={2}
                    disabled={disabled}
                />
                <button 
                  onClick={() => openSuggestionModal('focus')}
                  disabled={isGenerating || disabled} 
                  className="absolute right-2 top-8 p-1.5 rounded-full text-stone-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Suggest Focus with AI"
                >
                    <span className="text-lg">✨</span>
                </button>
            </div>
            <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Top Goals</label>
                <div className="space-y-2">
                    {goals.map((goal, index) => (
                      <div key={goal.id}>
                        <div className="relative">
                           <InputField
                             id={`goal-${goal.id}`}
                             value={goal.text}
                             onChange={(e) => handleUpdateGoal(goal.id, e.target.value)}
                             placeholder={`Goal #${index + 1}`}
                             disabled={disabled}
                             className="pr-20"
                           />
                           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                <label htmlFor={`file-${goal.id}`} className="p-1.5 rounded-full hover:bg-stone-100 cursor-pointer text-stone-500 hover:text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Attach file">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                </label>
                                <input type="file" id={`file-${goal.id}`} className="hidden" onChange={(e) => handleFileChange(goal.id, e)} disabled={disabled} accept="image/*,.pdf,.doc,.docx,.txt" />
                                <button onClick={() => openSuggestionModal('goal', goal.id)} disabled={isGenerating || disabled || !focus} title="Suggest Goal with AI" className="p-1.5 text-lg rounded-full hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">✨</button>
                           </div>
                        </div>
                         {goal.attachment && (
                            <div className="mt-1.5 flex items-center justify-between bg-stone-100 px-2 py-1 rounded-md text-sm">
                                <span className="text-stone-600 truncate">{goal.attachment.name}</span>
                                <button onClick={() => handleRemoveAttachment(goal.id)} className="text-stone-400 hover:text-red-500 ml-2 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                      </div>
                    ))}
                </div>
                <div className="mt-2 text-right">
                    <button onClick={handleAddGoalField} disabled={disabled} className="text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:text-stone-400 transition-colors">
                        + Add another goal
                    </button>
                </div>
            </div>
            <Button onClick={handlePost} disabled={disabled || !focus.trim() || goals.every(g => g.text.trim() === '')} isLoading={isGenerating} className="w-full">
                Post Morning Intention
            </Button>
        </div>
    </div>
  );
};

export default PostCreator;