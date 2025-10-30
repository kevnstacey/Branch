import { supabase } from '../integrations/supabase/client';
import { Pod, User, CheckIn, GoalStatus, Comment, Reaction, Notification, FeedGoal, Attachment } from '../../types';

// Fetches the current user's profile from the 'users' table
export const fetchCurrentUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, photo_url')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  if (data) {
    return {
      id: data.id,
      name: data.name || data.email?.split('@')[0] || 'User',
      email: data.email || '',
      avatar: data.photo_url || '👤',
    };
  }
  return null;
};

// Fetches a single pod with its members, check-ins, goals, comments, reactions, and notifications
export const fetchPodData = async (podId: string, currentUserId: string): Promise<Pod | null> => {
  // Fetch pod details
  const { data: podData, error: podError } = await supabase
    .from('pods')
    .select('*')
    .eq('id', podId)
    .single();

  if (podError) {
    console.error('Error fetching pod:', podError);
    return null;
  }

  if (!podData) return null;

  // Fetch pod members
  const { data: memberData, error: memberError } = await supabase
    .from('pod_members')
    .select('user_id, role, users(id, name, email, photo_url)')
    .eq('pod_id', podId);

  if (memberError) {
    console.error('Error fetching pod members:', memberError);
    return null;
  }

  const members: User[] = memberData?.map((pm: any) => ({
    id: pm.users.id,
    name: pm.users.name || pm.users.email?.split('@')[0] || 'User',
    email: pm.users.email || '',
    avatar: pm.users.photo_url || '👤',
  })) || [];

  // Fetch check-ins, goals, comments, and reactions
  const { data: checkInsData, error: checkInsError } = await supabase
    .from('check_ins')
    .select(`
      id,
      user_id,
      timestamp,
      type,
      focus,
      evening_recap,
      goals (
        id, text, status, attachment_name, attachment_type, attachment_url
      ),
      comments (
        id, user_id, text, created_at
      ),
      reactions (
        id, user_id, emoji
      )
    `)
    .eq('pod_id', podId)
    .order('timestamp', { ascending: false });

  if (checkInsError) {
    console.error('Error fetching check-ins:', checkInsError);
    return null;
  }

  const checkIns: CheckIn[] = checkInsData?.map((ci: any) => ({
    id: ci.id,
    userId: ci.user_id, // Map user_id from DB to userId in type
    timestamp: ci.timestamp,
    type: ci.type,
    focus: ci.focus,
    eveningRecap: ci.evening_recap,
    goals: ci.goals.map((g: any) => ({
      id: g.id, // Include goal ID
      text: g.text,
      status: g.status as GoalStatus,
      attachment: g.attachment_name ? { name: g.attachment_name, type: g.attachment_type, url: g.attachment_url } : undefined,
    })),
    comments: ci.comments.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      text: c.text,
      timestamp: c.created_at,
    })),
    reactions: ci.reactions.map((r: any) => ({
      emoji: r.emoji,
      userId: r.user_id,
    })),
  })) || [];

  // Fetch notifications for the current user within this pod
  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .eq('target_user_id', currentUserId)
    .eq('check_in_id', checkIns.map(ci => ci.id)) // Filter notifications relevant to this pod's check-ins
    .order('created_at', { ascending: false });

  if (notificationsError) {
    console.error('Error fetching notifications:', notificationsError);
    // Don't block the app if notifications fail, return empty array
  }

  const notifications: Notification[] = notificationsData?.map((n: any) => ({
    id: n.id,
    type: n.type,
    fromUserId: n.from_user_id,
    checkInId: n.check_in_id,
    timestamp: n.created_at,
    read: n.read,
  })) || [];

  return {
    id: podData.id,
    name: podData.title, // Changed from podData.name to podData.title
    members,
    checkIns,
    notifications,
  };
};

// Creates a new user profile in the 'users' table if it doesn't exist
export const ensureUserProfile = async (supabaseUser: any): Promise<User> => {
  const { data: existingProfile, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, photo_url')
    .eq('id', supabaseUser.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching existing user profile:', fetchError);
  }

  if (existingProfile) {
    return {
      id: existingProfile.id,
      name: existingProfile.name || existingProfile.email?.split('@')[0] || 'User',
      email: existingProfile.email || '',
      avatar: existingProfile.photo_url || '👤',
    };
  } else {
    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: supabaseUser.id,
        name: supabaseUser.user_metadata.name || supabaseUser.email?.split('@')[0],
        email: supabaseUser.email,
        photo_url: supabaseUser.user_metadata.photo_url || supabaseUser.user_metadata.avatar_url,
      })
      .select('id, name, email, photo_url')
      .single();

    if (insertError) {
      console.error('Error creating new user profile:', insertError);
      throw insertError;
    }
    return {
      id: newProfile.id,
      name: newProfile.name || newProfile.email?.split('@')[0] || 'User',
      email: newProfile.email || '',
      avatar: newProfile.photo_url || '👤',
    };
  }
};

// Creates a new pod and adds the current user as a member
export const createNewPod = async (podName: string, userId: string): Promise<Pod | null> => {
  const { data: newPod, error: podError } = await supabase
    .from('pods')
    .insert({ title: podName, owner_id: userId }) // Changed from name to title
    .select('*')
    .single();

  if (podError) {
    console.error('Error creating new pod:', podError);
    return null;
  }

  // Add the creator as a member
  const { error: memberError } = await supabase
    .from('pod_members')
    .insert({ pod_id: newPod.id, user_id: userId, role: 'owner' });

  if (memberError) {
    console.error('Error adding creator to pod_members:', memberError);
    // Consider rolling back pod creation here if necessary
    return null;
  }

  return {
    id: newPod.id,
    name: newPod.title, // Changed from newPod.name to newPod.title
    members: [], // Will be populated on next fetch
    checkIns: [],
    notifications: [],
  };
};

// Adds a new check-in (morning intention)
export const addCheckIn = async (
  userId: string,
  podId: string,
  focus: string,
  goals: { text: string; attachment?: File }[]
): Promise<CheckIn | null> => {
  const { data: newCheckIn, error: checkInError } = await supabase
    .from('check_ins')
    .insert({ user_id: userId, pod_id: podId, type: 'morning', focus })
    .select('id, user_id, timestamp, type, focus, evening_recap')
    .single();

  if (checkInError) {
    console.error('Error adding check-in:', checkInError);
    return null;
  }

  const newGoals: FeedGoal[] = [];
  for (const goal of goals) {
    let attachmentData: Attachment | undefined;
    if (goal.attachment) {
      // In a real app, you'd upload the file to Supabase Storage here
      // For now, we'll just store the data URL in the database
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(goal.attachment!);
      });
      attachmentData = {
        name: goal.attachment.name,
        type: goal.attachment.type,
        url: dataUrl,
      };
    }

    const { data: newGoal, error: goalError } = await supabase
      .from('goals')
      .insert({
        check_in_id: newCheckIn.id,
        text: goal.text,
        status: GoalStatus.Partial,
        attachment_name: attachmentData?.name,
        attachment_type: attachmentData?.type,
        attachment_url: attachmentData?.url,
      })
      .select('*')
      .single();

    if (goalError) {
      console.error('Error adding goal:', goalError);
      // Handle error, maybe delete the check-in
      continue;
    }
    newGoals.push({
      id: newGoal.id, // Include goal ID
      text: newGoal.text,
      status: newGoal.status as GoalStatus,
      attachment: attachmentData,
    });
  }

  return {
    id: newCheckIn.id, // Explicitly include id
    userId: newCheckIn.user_id, // Map user_id from DB to userId in type
    timestamp: newCheckIn.timestamp,
    type: newCheckIn.type as 'morning' | 'evening',
    focus: newCheckIn.focus,
    eveningRecap: newCheckIn.evening_recap,
    goals: newGoals,
    comments: [],
    reactions: [],
  };
};

// Updates an existing check-in (evening reflection)
export const updateCheckIn = async (
  checkInId: string,
  goals: FeedGoal[],
  eveningRecap: string
): Promise<CheckIn | null> => {
  // Update check-in main details
  const { data: updatedCheckIn, error: checkInError } = await supabase
    .from('check_ins')
    .update({ type: 'evening', evening_recap: eveningRecap, timestamp: new Date().toISOString() })
    .eq('id', checkInId)
    .select('id, user_id, timestamp, type, focus, evening_recap')
    .single();

  if (checkInError) {
    console.error('Error updating check-in:', checkInError);
    return null;
  }

  // Update goals
  for (const goal of goals) {
    // Assuming goal.id exists for existing goals
    if (!goal.id) {
      console.warn('Attempted to update a goal without an ID. Skipping:', goal);
      continue;
    }
    const { error: goalError } = await supabase
      .from('goals')
      .update({ status: goal.status })
      .eq('id', goal.id); // Use goal.id for update

    if (goalError) {
      console.error('Error updating goal status:', goalError);
    }
  }

  return {
    id: updatedCheckIn.id, // Explicitly include id
    userId: updatedCheckIn.user_id, // Map user_id from DB to userId in type
    timestamp: updatedCheckIn.timestamp,
    type: updatedCheckIn.type as 'morning' | 'evening',
    focus: updatedCheckIn.focus,
    eveningRecap: updatedCheckIn.evening_recap,
    goals, // Return the updated goals
    comments: [], // These would need to be fetched separately if needed
    reactions: [], // These would need to be fetched separately if needed
  };
};

// Adds a comment to a check-in
export const addComment = async (
  checkInId: string,
  userId: string,
  text: string,
  targetUserId: string // The user who owns the check-in, for notification
): Promise<Comment | null> => {
  const { data: newComment, error: commentError } = await supabase
    .from('comments')
    .insert({ check_in_id: checkInId, user_id: userId, text })
    .select('*')
    .single();

  if (commentError) {
    console.error('Error adding comment:', commentError);
    return null;
  }

  // Create a notification for the check-in owner
  if (userId !== targetUserId) { // Don't notify user about their own comment
    await addNotification(userId, targetUserId, checkInId, 'comment');
  }

  return {
    id: newComment.id,
    userId: newComment.user_id,
    text: newComment.text,
    timestamp: newComment.created_at,
  };
};

// Adds a reaction to a check-in
export const addReaction = async (
  checkInId: string,
  userId: string,
  emoji: string,
  targetUserId: string // The user who owns the check-in, for notification
): Promise<Reaction | null> => {
  // Check if user already reacted to this check-in
  const { data: existingReaction, error: fetchError } = await supabase
    .from('reactions')
    .select('id, emoji')
    .eq('check_in_id', checkInId)
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error fetching existing reaction:', fetchError);
    return null;
  }

  if (existingReaction) {
    if (existingReaction.emoji === emoji) {
      // User is toggling off their existing reaction
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);
      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        return null;
      }
      return null; // Reaction removed
    } else {
      // User is changing their reaction
      const { data: updatedReaction, error: updateError } = await supabase
        .from('reactions')
        .update({ emoji })
        .eq('id', existingReaction.id)
        .select('*')
        .single();
      if (updateError) {
        console.error('Error updating reaction:', updateError);
        return null;
      }
      return { emoji: updatedReaction.emoji, userId: updatedReaction.user_id };
    }
  } else {
    // Add new reaction
    const { data: newReaction, error: insertError } = await supabase
      .from('reactions')
      .insert({ check_in_id: checkInId, user_id: userId, emoji })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error adding reaction:', insertError);
      return null;
    }

    // Create a notification for the check-in owner
    if (userId !== targetUserId) { // Don't notify user about their own reaction
      await addNotification(userId, targetUserId, checkInId, 'reaction');
    }

    return { emoji: newReaction.emoji, userId: newReaction.user_id };
  }
};

// Adds a notification
export const addNotification = async (
  fromUserId: string,
  targetUserId: string,
  checkInId: string,
  type: 'reaction' | 'comment'
): Promise<Notification | null> => {
  const { data: newNotification, error } = await supabase
    .from('notifications')
    .insert({ from_user_id: fromUserId, target_user_id: targetUserId, check_in_id: checkInId, type })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding notification:', error);
    return null;
  }
  return {
    id: newNotification.id,
    type: newNotification.type,
    fromUserId: newNotification.from_user_id,
    checkInId: newNotification.check_in_id,
    timestamp: newNotification.created_at,
    read: newNotification.read,
  };
};

// Marks all notifications for a user as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('target_user_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Invites a new member to a pod (simplified for now)
export const inviteMemberToPod = async (podId: string, inviteeEmail: string): Promise<boolean> => {
  // In a real application, this would involve sending an actual invite,
  // potentially creating a pending user, and then adding them to pod_members
  // once they accept and sign up.
  // For this demo, we'll simulate it by just logging and returning true.
  console.log(`Simulating invite for ${inviteeEmail} to pod ${podId}`);
  return true;
};

// Fetches all pods the current user is a member of
export const fetchUserPods = async (userId: string): Promise<Pod[]> => {
  const { data, error } = await supabase
    .from('pod_members')
    .select('pod_id, pods(id, title, owner_id)') // Changed from name to title
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user pods:', error);
    return [];
  }

  return data?.map((pm: any) => ({
    id: pm.pods.id,
    name: pm.pods.title, // Changed from pm.pods.name to pm.pods.title
    members: [], // Will be populated by fetchPodData
    checkIns: [], // Will be populated by fetchPodData
    notifications: [], // Will be populated by fetchPodData
  })) || [];
};