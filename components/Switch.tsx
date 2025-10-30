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
        className="react-switch-checkbox"
        id={id}
        type="checkbox"
      />
      <label
        style={{ background: isOn ? '#10B981' : '#E5E7EB' }}
        className="react-switch-label"
        htmlFor={id}
      >
        <span className={`react-switch-button`} />
      </label>
      <style>{`
        .react-switch-checkbox {
          height: 0;
          width: 0;
          visibility: hidden;
        }
        .react-switch-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          width: 40px;
          height: 20px;
          border-radius: 100px;
          position: relative;
          transition: background-color .2s;
        }
        .react-switch-label .react-switch-button {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 45px;
          transition: 0.2s;
          background: #fff;
          box-shadow: 0 0 2px 0 rgba(10, 10, 10, 0.29);
        }
        .react-switch-checkbox:checked + .react-switch-label .react-switch-button {
          left: calc(100% - 2px);
          transform: translateX(-100%);
        }
      `}</style>
    </>
  );
};

export default Switch;
