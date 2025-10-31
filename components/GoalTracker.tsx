// components/GoalTracker.tsx
import React, { useState } from 'react';
import { FeedGoal, GoalStatus } from '../types';

interface GoalTrackerProps {
  goals: FeedGoal[];
  onGoalsChange: (goals: FeedGoal[]) => void;
  isEditable: boolean;
  onAddGoal?: (goalText: string) => void;
  onRemoveGoal?: (goalId: string) => void; // Changed to use goalId
}

const GoalStatusButton: React.FC<{ status: GoalStatus; onClick: () => void; isSelected: boolean }> = ({ status, onClick, isSelected }) => {
  const statusConfig = {
    [GoalStatus.Done]: { icon: '✅', label: 'Done', classes: 'bg-emerald-100 text-emerald-800' },
    [GoalStatus.Partial]: { icon: '🌗', label: 'Partial', classes: 'bg-yellow-100 text-yellow-800' },
    [GoalStatus.Skipped]: { icon: '❌', label: 'Skipped', classes: 'bg-red-100 text-red-800' },
  };
  const config = statusConfig[status];

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${isSelected ? config.classes : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
      aria-pressed={isSelected}
      title={config.label}
    >
      {config.icon}
    </button>
  );
};

// Refactored GoalItem to use goal.id for state updates.
const GoalItem: React.FC<{goal: FeedGoal, isEditable: boolean, onStatusChange: (id: string, status: GoalStatus) => void, onRemove?: (id: string) => void}> = ({ goal, isEditable, onStatusChange, onRemove }) => {
    const statusIcons = {
        [GoalStatus.Done]: '✅',
        [GoalStatus.Partial]: '🌗',
        [GoalStatus.Skipped]: '❌'
    };
    return (
        <li className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg group">
            <span className="text-sm text-stone-700 flex-1 pr-4">{goal.text}</span>
            {isEditable ? (
              <div className="flex items-center space-x-1.5">
                {(Object.values(GoalStatus) as GoalStatus[]).map(status => (
                  <GoalStatusButton
                    key={status}
                    status={status}
                    isSelected={goal.status === status}
                    onClick={() => onStatusChange(goal.id!, status)} // Use goal.id
                  />
                ))}
                {onRemove && goal.id && ( // Ensure goal.id exists before allowing remove
                    <button onClick={() => onRemove(goal.id!)} className="ml-2 text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
              </div>
            ) : (
                <span className="text-2xl" title={goal.status}>
                   {statusIcons[goal.status]}
                </span>
            )}
        </li>
    );
}

const GoalTracker: React.FC<GoalTrackerProps> = ({ goals, onGoalsChange, isEditable, onAddGoal, onRemoveGoal }) => {
  const [newGoalText, setNewGoalText] = useState('');

  // Updated status change handler to operate on the goal's ID.
  const handleStatusChange = (goalId: string, newStatus: GoalStatus) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === goalId ? { ...goal, status: newStatus } : goal
    );
    onGoalsChange(updatedGoals);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim() && onAddGoal) {
      onAddGoal(newGoalText);
      setNewGoalText('');
    }
  };
  
  // Updated remove handler to operate on the goal's ID.
  const handleRemoveGoal = (goalId: string) => {
    if (onRemoveGoal) {
        onRemoveGoal(goalId);
    }
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {/* Use goal.id as the key */}
        {goals.map((goal) => (
          <GoalItem 
            key={goal.id} // Use goal.id as key
            goal={goal}
            isEditable={isEditable} 
            onStatusChange={handleStatusChange} 
            onRemove={onRemoveGoal ? handleRemoveGoal : undefined}
            />
        ))}
      </ul>
      {onAddGoal && (
        <form onSubmit={handleAddGoal} className="flex items-center space-x-2">
          <input
            type="text"
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            placeholder="Add another goal..."
            className="flex-grow px-3 py-1.5 bg-white border border-stone-300 rounded-md shadow-sm placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
          />
          <button type="submit" className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200 transition-colors">
            Add
          </button>
        </form>
      )}
    </div>
  );
};

export default GoalTracker;