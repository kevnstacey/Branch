import React from 'react';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  id: string;
  rows?: number;
  disabled?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({ label, value, onChange, placeholder, id, rows = 3, disabled = false }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full px-4 py-2 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150 ease-in-out disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default TextArea;
