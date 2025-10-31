"use client";

import { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Pod, User, CheckIn, Notification } from '../../types';
import { supabase } from '../integrations/supabase/client';
import {
  fetchPodData,
  ensureUserProfile,
  createNewPod,
  addCheckIn,
  updateCheckIn,
  addComment,
  addReaction,
  markAllNotificationsAsRead,
  fetchUserPods,
} from '../services/supabaseService';
import { generateEncouragement } from '@/services/geminiService';

interface UsePodDataProps {
  session: Session | null;
}

interface UsePodDataReturn {
  currentUser: User | null;
  activePod: Pod | null;
  currentView: 'my-dashboard' | string;
  selectedDate: Date | null;
  highlightedCheckInId: string | null;
  eveningModalOpen: boolean;
  checkInToUpdate: CheckIn | null;
  inviteModalOpen: boolean;
  pushedGoals: string[];
  usageCount: number;
  limitReached: boolean;
  handleViewChange: (view: 'my-dashboard' | string) => void;
  handleDateSelect: (date: Date | null) => void;
  handleNotificationClick: (notification: Notification) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  handleAddCheckIn: (focus: string, goals: { text: string; attachment?: File }[]) => Promise<void>;
  handleUpdateCheckIn: (updatedCheckIn: CheckIn, pushedGoalsForTomorrow: string[]) => Promise<void>;
  handleAddComment: (checkInId: string, text: string) => Promise<void>;
  handleAddReaction: (checkInId: string, emoji: string) => Promise<void>;
  setInviteModalOpen: (isOpen: boolean) => void;
  setEveningModalOpen: (isOpen: boolean) => void;
  setCheckInToUpdate: (checkIn: CheckIn | null) => void;
  incrementUsage: () => void; // Added incrementUsage to the return interface
}

export const usePodData = ({ session }: UsePodDataProps): UsePodDataReturn => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activePod, setActivePod] = useState<Pod | null>(null);
  const [currentView, setCurrentView] = useState<'my-dashboard' | string>('my-dashboard');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [highlightedCheckInId, setHighlightedCheckInId] = useState<string | null>(null);
  
  const [eveningModalOpen, setEveningModalOpen] = useState(false);
  const [checkInToUpdate, setCheckInToUpdate] = useState<CheckIn | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const [pushedGoals, setPushedGoals] = useState<string[]>([]);

  const [usageCount, setUsageCount] = useState<number>(() => {
    return parseInt(sessionStorage.getItem('branchUsageCount') || '0', 10);
  });

  const incrementUsage = useCallback(() => {
    setUsageCount(prev => {
      const newCount = prev + 1;
      sessionStorage.setItem('branchUsageCount', newCount.toString());
      return newCount;
    });
  }, []);

  const limitReached = usageCount >= 10;

  // Fetch user profile and pods on session change
  useEffect(() => {
    const loadUserData = async () => {
      if (session?.user) {
        console.log('Session user found:', session.user);
        const appUser = await ensureUserProfile(session.user);
        if (!appUser) {
          console.error('Failed to load user profile. This might indicate a delay in the Supabase `handle_new_user` trigger or a configuration issue.');
          setCurrentUser(null); // Explicitly set to null to keep spinner
          setActivePod(null); // Explicitly set to null to keep spinner
          return; // Stop further loading
        }
        console.log('App user after ensureUserProfile:', appUser);
        setCurrentUser(appUser);

        const pods = await fetchUserPods(appUser.id);
        console.log('Pods fetched:', pods);

        if (pods.length > 0) {
          // For now, just pick the first pod. In a real app, user would select.
          const fullPodData = await fetchPodData(pods[0].id, appUser.id);
          console.log('Full pod data fetched (existing pod):', fullPodData);
          setActivePod(fullPodData);
        } else {
          console.log('No pods found for user, creating a new one...');
          const newPod = await createNewPod(`${appUser.name}'s Pod`, appUser.id);
          console.log('New pod created:', newPod);
          if (newPod) {
            const fullPodData = await fetchPodData(newPod.id, appUser.id);
            console.log('Full pod data fetched (new pod):', fullPodData);
            setActivePod(fullPodData);
          } else {
            console.error('Failed to create new pod.');
          }
        }
      } else {
        console.log('No session user found.');
      }
    };
    loadUserData();
  }, [session]);

  // Real-time subscription for active pod data
  useEffect(() => {
    if (!activePod?.id || !currentUser?.id) return;

    const channel = supabase
      .channel(`pod:${activePod.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins', filter: `pod_id=eq.${activePod.id}` }, payload => {
        console.log('Change received!', payload);
        // Refetch pod data to ensure all nested relations are updated
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `check_in_id=in.(${activePod.checkIns.map(ci => ci.id).join(',')})` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `check_in_id=in.(${activePod.checkIns.map(ci => ci.id).join(',')})` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions', filter: `check_in_id=in.(${activePod.checkIns.map(ci => ci.id).join(',')})` }, payload => {
        console.log('Change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `target_user_id=eq.${currentUser.id}` }, payload => {
        console.log('Notification change received!', payload);
        fetchPodData(activePod.id, currentUser.id).then(setActivePod);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activePod?.id, currentUser?.id, activePod?.checkIns]);

  const handleViewChange = useCallback((view: 'my-dashboard' | string) => {
    setCurrentView(view);
    setSelectedDate(null); // Reset date filter when changing views
  }, []);

  const handleDateSelect = useCallback((date: Date | null) => {
    setSelectedDate(date);
  }, []);
  
  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!activePod || !currentUser) return;

    // Mark notification as read in DB
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    if (error) {
      console.error('Error marking notification as read:', error);
    }

    // Refetch pod data to update notification status in UI
    const updatedPod = await fetchPodData(activePod.id, currentUser.id);
    if (updatedPod) setActivePod(updatedPod);

    // Determine which dashboard to switch to
    const targetCheckIn = activePod.checkIns.find(c => c.id === notification.checkInId);
    if (!targetCheckIn) return;

    const targetView = targetCheckIn.userId === currentUser.id ? 'my-dashboard' : targetCheckIn.userId;
    setCurrentView(targetView);
    
    // Highlight the check-in
    setHighlightedCheckInId(notification.checkInId);
    setTimeout(() => {
        const element = document.getElementById(`checkin-${notification.checkInId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    setTimeout(() => setHighlightedCheckInId(null), 3000);
  }, [activePod, currentUser]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!currentUser || !activePod) return;
    await markAllNotificationsAsRead(currentUser.id);
    const updatedPod = await fetchPodData(activePod.id, currentUser.id);
    if (updatedPod) setActivePod(updatedPod);
  }, [currentUser, activePod]);

  const handleAddCheckIn = useCallback(async (focus: string, goals: { text: string; attachment?: File }[]) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();

    const newCheckIn = await addCheckIn(currentUser.id, activePod.id, focus, goals);
    if (newCheckIn) {
      // AI generates an encouragement comment from another user
      setTimeout(async () => {
          try {
              const encouragementText = await generateEncouragement(currentUser, newCheckIn);
              // Find a podmate who is not the current user
              const friendlyPodmate = activePod.members.find(m => m.id !== currentUser.id) || activePod.members[0];
              
              if (friendlyPodmate && newCheckIn.id) {
                await addComment(newCheckIn.id, friendlyPodmate.id, encouragementText, currentUser.id);
              }
          } catch (error) { console.error("Failed to generate encouragement:", error); }
      }, 2500);
    }
    setPushedGoals([]); // Clear pushed goals after using them
  }, [limitReached, currentUser, activePod, incrementUsage]);

  const handleUpdateCheckIn = useCallback(async (updatedCheckIn: CheckIn, pushedGoalsForTomorrow: string[]) => {
    if (!activePod) return;
    const result = await updateCheckIn(updatedCheckIn.id, updatedCheckIn.goals, updatedCheckIn.eveningRecap || '');
    if (result) {
      setEveningModalOpen(false);
      setPushedGoals(pushedGoalsForTomorrow);
    }
  }, [activePod]);
  
  const handleAddComment = useCallback(async (checkInId: string, text: string) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();
    const targetCheckIn = activePod.checkIns.find(ci => ci.id === checkInId);
    if (targetCheckIn) {
      await addComment(checkInId, currentUser.id, text, targetCheckIn.userId);
    }
  }, [limitReached, currentUser, activePod, incrementUsage]);

  const handleAddReaction = useCallback(async (checkInId: string, emoji: string) => {
    if (limitReached || !currentUser || !activePod) return;
    incrementUsage();
    const targetCheckIn = activePod.checkIns.find(ci => ci.id === checkInId);
    if (targetCheckIn) {
      await addReaction(checkInId, currentUser.id, emoji, targetCheckIn.userId);
    }
  }, [limitReached, currentUser, activePod, incrementUsage]);

  return {
    currentUser,
    activePod,
    currentView,
    selectedDate,
    highlightedCheckInId,
    eveningModalOpen,
    checkInToUpdate,
    inviteModalOpen,
    pushedGoals,
    usageCount,
    limitReached,
    handleViewChange,
    handleDateSelect,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleAddCheckIn,
    handleUpdateCheckIn,
    handleAddComment,
    handleAddReaction,
    setInviteModalOpen,
    setEveningModalOpen,
    setCheckInToUpdate,
    incrementUsage, // Return incrementUsage from the hook
  };
};