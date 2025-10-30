// components/EveningCheckInModal.tsx
import React, { useState, useEffect } from 'react';
import { CheckIn, FeedGoal, GoalStatus } from '../types';
import Button from './Button';
import TextArea from './TextArea';
import { generateEveningSummary } from '../services/geminiService';

interface EveningCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkIn: CheckIn | null;
  onUpdateCheckIn: (updatedCheckIn: CheckIn, pushedGoals: string[]) => void;
}

const EveningCheckInModal: React.FC<EveningCheckInModalProps> = ({ isOpen, onClose, checkIn, onUpdateCheckIn }) => {
  const [goals, setGoals] = useState<FeedGoal[]>([]);
  const [pushedGoals, setPushedGoals] = useState<string[]>([]);
  const [recap, setRecap] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (checkIn) {
      // Deep copy to avoid mutating the original state
      setGoals(JSON.parse(JSON.stringify(checkIn.goals))); 
      setRecap(checkIn.eveningRecap || '');
      setPushedGoals([]);
    }
  }, [checkIn]);
  
  if (!isOpen || !checkIn) return null;

  const handleStatusChange = (index: number, status: GoalStatus) => {
    setGoals(prev => prev.map((g, i) => i === index ? { ...g, status } : g));
  };

  const handleTogglePushedGoal = (goalText: string) => {
    setPushedGoals(prev => 
      prev.includes(goalText) ? prev.filter(g => g !== goalText) : [...prev, goalText]
    );
  };
  
  const handleGenerateRecap = async () => {
    setIsGenerating(true);
    try {
        const tempCheckin = {...checkIn, goals};
        const generatedRecap = await generateEveningSummary(tempCheckin);
        setRecap(generatedRecap);
    } catch(e) {
        console.error("Error generating recap:", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const updatedCheckIn: CheckIn = {
      ...checkIn,
      type: 'evening',
      goals,
      eveningRecap: recap,
      // Update timestamp to reflect when the evening check-in was completed
      timestamp: new Date().toISOString(), 
    };
    onUpdateCheckIn(updatedCheckIn, pushedGoals);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-stone-800">Evening Reflection</h2>
          <p className="text-sm text-stone-600 mt-1">How did your day go regarding your focus: <span className="font-semibold">"{checkIn.focus}"</span>?</p>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {goals.map((goal, index) => (
            <div key={index} className="bg-stone-50 p-3 rounded-lg">
              <p className="text-sm text-stone-800 mb-2">{goal.text}</p>
              {goal.attachment && (
                <div className="mb-2 flex items-center space-x-2 text-xs text-stone-500 bg-stone-200/50 px-2 py-1 rounded-md w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  <span>{goal.attachment.name}</span>
                </div>
              )}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  {(Object.values(GoalStatus) as GoalStatus[]).map(status => (
                    <button key={status} onClick={() => handleStatusChange(index, status)} className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all ${goal.status === status ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>
                      {status}
                    </button>
                  ))}
                </div>
                {goal.status !== GoalStatus.Done && (
                  <button onClick={() => handleTogglePushedGoal(goal.text)} className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${pushedGoals.includes(goal.text) ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-600 hover:bg-blue-100'}`}>
                    <span>➡️</span>
                    <span>Push to Tomorrow</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div>
            <TextArea
                label="Your Recap"
                id="evening-recap"
                value={recap}
                onChange={(e) => setRecap(e.target.value)}
                placeholder="What went well? What did you learn?"
            />
             <div className="text-right -mt-1">
                <button onClick={handleGenerateRecap} disabled={isGenerating} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:text-stone-400 transition-colors">
                    ✨ Suggest Recap with AI
                </button>
            </div>
        </div>
        
        <Button onClick={handleSave} disabled={isGenerating || !goals.some(g => g.status !== GoalStatus.Partial)}>
            Save Reflection
        </Button>
      </div>
    </div>
  );
};

export default EveningCheckInModal;