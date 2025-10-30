// components/PodMembers.tsx
import React from 'react';
import { User } from '../types';
import Avatar from './Avatar';
import Button from './Button';

interface PodMembersProps {
  members: User[];
  onInvite: () => void;
  currentUser: User;
  onSelectUser: (userId: string) => void;
  currentView: 'my-dashboard' | string;
}

const PodMembers: React.FC<PodMembersProps> = ({ members, onInvite, currentUser, onSelectUser, currentView }) => {
  const isUserSelected = (userId: string) => {
    if (currentView === 'my-dashboard' && userId === currentUser.id) return true;
    return currentView === userId;
  }
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-stone-200/80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-stone-800">Pod Members</h3>
        <span className="text-sm font-medium text-stone-500">{members.length} member{members.length !== 1 ? 's' : ''}</span>
      </div>
      <ul className="space-y-1 mb-4">
        {/* Current user always on top */}
        {[currentUser, ...members.filter(m => m.id !== currentUser.id)].map(member => (
          <li key={member.id}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onSelectUser(member.id === currentUser.id ? 'my-dashboard' : member.id)}}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${isUserSelected(member.id) ? 'bg-emerald-100/80' : 'hover:bg-stone-100'}`}
            >
              <Avatar user={member} size="md" />
              <div>
                <p className={`font-medium text-sm ${isUserSelected(member.id) ? 'text-emerald-800' : 'text-stone-800'}`}>
                  {member.name} {member.id === currentUser.id && '(You)'}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <Button onClick={onInvite} variant="secondary" className="w-full">
        + Invite new member
      </Button>
    </div>
  );
};

export default PodMembers;
