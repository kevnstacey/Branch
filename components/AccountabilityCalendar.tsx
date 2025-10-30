// components/AccountabilityCalendar.tsx
import React, { useState } from 'react';
import { CheckIn, User } from '../types';
import Avatar from './Avatar';

interface AccountabilityCalendarProps {
  checkIns: CheckIn[];
  members: User[];
  onDateSelect: (date: Date | null) => void;
  selectedDate: Date | null;
  pushedGoalsCount: number;
}

const AccountabilityCalendar: React.FC<AccountabilityCalendarProps> = ({ checkIns, members, onDateSelect, selectedDate, pushedGoalsCount }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const checkInsByDate: { [key: string]: User[] } = {};
  checkIns.forEach(checkIn => {
    const dateStr = new Date(checkIn.timestamp).toDateString();
    if (!checkInsByDate[dateStr]) {
      checkInsByDate[dateStr] = [];
    }
    const user = members.find(m => m.id === checkIn.userId);
    if (user && !checkInsByDate[dateStr].find(u => u.id === user.id)) {
      checkInsByDate[dateStr].push(user);
    }
  });
  
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const renderMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="font-medium text-stone-500 h-8 flex items-center justify-center">{day}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
        {days.map(day => {
          const date = new Date(year, month, day);
          const dateStr = date.toDateString();
          const isToday = dateStr === today.toDateString();
          const isSelected = selectedDate && dateStr === selectedDate.toDateString();
          const usersOnDay = checkInsByDate[dateStr] || [];
          const isTomorrowWithGoals = dateStr === tomorrow.toDateString() && pushedGoalsCount > 0;

          return (
            <div key={day} className="py-1" onClick={() => onDateSelect(isSelected ? null : date)}>
              <div className={`w-9 h-9 mx-auto flex flex-col items-center justify-center rounded-full cursor-pointer relative transition-colors ${isSelected ? 'bg-emerald-600 text-white' : isToday ? 'bg-emerald-200 text-emerald-800' : 'hover:bg-stone-100'}`}>
                <span>{day}</span>
                {usersOnDay.length > 0 && (
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex space-x-px">
                      {usersOnDay.slice(0, 3).map(u => <div key={u.id} className="w-1 h-1 rounded-full bg-emerald-500"></div>)}
                   </div>
                )}
                 {isTomorrowWithGoals && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" title={`${pushedGoalsCount} goal(s) pushed to tomorrow`}></div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeek = () => {
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const weekDays = Array(7).fill(null).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        return date;
    });

    return (
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map((date) => {
          const dateStr = date.toDateString();
          const isToday = dateStr === today.toDateString();
          const isSelected = selectedDate && dateStr === selectedDate.toDateString();
          const usersOnDay = checkInsByDate[dateStr] || [];
          const isTomorrowWithGoals = dateStr === tomorrow.toDateString() && pushedGoalsCount > 0;

          return (
            <div key={date.toISOString()} className="py-1 space-y-1" onClick={() => onDateSelect(isSelected ? null : date)}>
              <div className="font-medium text-stone-500 text-xs">{date.toLocaleDateString('default', { weekday: 'short' })}</div>
              <div className={`w-9 h-9 mx-auto flex items-center justify-center rounded-full cursor-pointer relative transition-colors ${isSelected ? 'bg-emerald-600 text-white' : isToday ? 'bg-emerald-200 text-emerald-800' : 'hover:bg-stone-100'}`}>
                <span>{date.getDate()}</span>
                 {isTomorrowWithGoals && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" title={`${pushedGoalsCount} goal(s) pushed to tomorrow`}></div>
                 )}
              </div>
              <div className="h-6 flex items-center justify-center space-x-[-8px]">
                  {usersOnDay.slice(0, 3).map(user => <Avatar key={user.id} user={user} size="sm" />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const changeMonth = (delta: number) => {
      setViewDate(prev => {
          const newDate = new Date(prev);
          newDate.setMonth(newDate.getMonth() + delta);
          return newDate;
      });
  };
  
  const changeWeek = (delta: number) => {
      setViewDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + (7 * delta));
          return newDate;
      });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-stone-200/80">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-stone-800 text-base">
          {viewMode === 'month' ? viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : `Week of ${viewDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`}
        </h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => viewMode === 'month' ? changeMonth(-1) : changeWeek(-1)} className="text-stone-500 hover:text-stone-800 p-1 rounded-full hover:bg-stone-100">&lt;</button>
          <button onClick={() => viewMode === 'month' ? changeMonth(1) : changeWeek(1)} className="text-stone-500 hover:text-stone-800 p-1 rounded-full hover:bg-stone-100">&gt;</button>
        </div>
      </div>
       <div className="flex justify-between items-center mb-3">
        <div className="bg-stone-100 p-1 rounded-lg text-xs">
          <button onClick={() => setViewMode('week')} className={`px-2 py-0.5 rounded-md ${viewMode === 'week' ? 'bg-white shadow-sm text-emerald-700 font-semibold' : 'text-stone-600'}`}>Week</button>
          <button onClick={() => setViewMode('month')} className={`px-2 py-0.5 rounded-md ${viewMode === 'month' ? 'bg-white shadow-sm text-emerald-700 font-semibold' : 'text-stone-600'}`}>Month</button>
        </div>
        {selectedDate && <button onClick={() => onDateSelect(null)} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800">Show All</button>}
      </div>
      <p className="text-xs text-stone-500 text-center mb-3">Click a day to review activity.</p>
      {viewMode === 'month' ? renderMonth() : renderWeek()}
    </div>
  );
};

export default AccountabilityCalendar;
