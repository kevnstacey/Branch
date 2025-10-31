// components/InviteModal.tsx
import React, { useState, useEffect } from 'react';
import Button from './Button';
import InputField from './InputField';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  podName: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, podName }) => {
  const [invitee, setInvitee] = useState('');
  const [method, setMethod] = useState<'email' | 'sms'>('email');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setInvitee('');
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleInvite = () => {
    if (!invitee) return;
    
    setStatus('sending');
    // Simulate network request & pod approval workflow
    setTimeout(() => {
      console.log(`Invited ${invitee} to ${podName} via ${method}`);
      setStatus('sent');
      // In a real app, you'd show a pending state until pod members approve.
      // For this demo, we'll just show a success message.
      alert(`An invite has been sent to ${invitee}.\nYour podmates have been notified to approve the new member.`);
      onClose();
    }, 1500); 
  };
  
  const handleInviteAnother = () => {
    setStatus('idle');
    setInvitee('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <div>
          <h2 className="text-xl font-bold text-stone-800">Invite to {podName}</h2>
          <p className="text-sm text-stone-600 mt-1">New members must be approved by all podmates.</p>
        </div>
       
        <form onSubmit={(e) => { e.preventDefault(); handleInvite(); }}>
            <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-lg mb-4">
              <button type="button" onClick={() => setMethod('email')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${method === 'email' ? 'bg-white shadow text-emerald-700' : 'text-stone-600'}`}>Email</button>
              <button type="button" onClick={() => setMethod('sms')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${method === 'sms' ? 'bg-white shadow text-emerald-700' : 'text-stone-600'}`}>SMS</button>
            </div>
            <InputField 
              id="invite-input"
              label={method === 'email' ? 'Email Address' : 'Phone Number'}
              placeholder={method === 'email' ? 'name@example.com' : '(555) 123-4567'}
              value={invitee}
              onChange={(e) => setInvitee(e.target.value)}
              disabled={status === 'sending'}
            />
            <div className="mt-5">
              {/* FIX: Changed button from type="submit" to a button with an onClick handler to satisfy the Button component's required props. */}
              <Button
                onClick={handleInvite}
                disabled={!invitee || status === 'sending'}
                isLoading={status === 'sending'}
                loadingText="Sending..."
                className="w-full"
              >
                Send Invitation
              </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
