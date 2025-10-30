import React from 'react';

interface InputFieldProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  id: string;
  disabled?: boolean;
  className?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, id, disabled = false, className = '' }) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-stone-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        type="text"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-white border border-stone-300 rounded-lg shadow-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition duration-150 ease-in-out disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed ${className}`}
        aria-label={label ? undefined : placeholder}
      />
    </div>
  );
};

export default InputField;