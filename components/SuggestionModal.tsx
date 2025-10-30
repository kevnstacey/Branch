// components/SuggestionModal.tsx
import React from 'react';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: string[];
  onSelectSuggestion: (selected: string) => void;
  title: string;
  description: string;
  isLoading: boolean;
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, suggestions, onSelectSuggestion, title, description, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative p-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="pr-8">
            <h2 className="text-xl font-bold text-stone-800">{title}</h2>
            <p className="text-sm text-stone-600 mt-1">{description}</p>
        </div>
        
        <div className="mt-4 max-h-64 overflow-y-auto pr-2">
            {isLoading ? (
                 <div className="text-center text-stone-500 py-8 flex flex-col items-center">
                    <svg className="animate-spin h-6 w-6 text-emerald-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Thinking...</span>
                 </div>
            ) : (
                <ul className="space-y-2">
                    {suggestions.map((suggestion, index) => (
                         <li 
                            key={index} 
                            onClick={() => onSelectSuggestion(suggestion)} 
                            className="p-3 rounded-lg cursor-pointer transition-colors border border-stone-200 hover:bg-emerald-50/80 text-stone-700"
                         >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionModal;
