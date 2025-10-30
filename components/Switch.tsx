// components/Switch.tsx
import React from 'react';

interface SwitchProps {
  isOn: boolean;
  handleToggle: () => void;
  id: string;
}

const Switch: React.FC<SwitchProps> = ({ isOn, handleToggle, id }) => {
  return (
    <>
      <input
        checked={isOn}
        onChange={handleToggle}
        className="sr-only peer" // Visually hide the checkbox but keep it accessible, use 'peer' for sibling styling
        id={id}
        type="checkbox"
      />
      <label
        htmlFor={id}
        className={`relative inline-flex items-center cursor-pointer w-10 h-5 rounded-full transition-colors duration-200 ease-in-out 
          ${isOn ? 'bg-emerald-500' : 'bg-stone-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out
            ${isOn ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </label>
    </>
  );
};

export default Switch;