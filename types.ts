// types.ts
export enum GoalStatus {
  Done = 'Done',
  Partial = 'Partial',
  Skipped = 'Skipped',
}

export interface Attachment {
  name: string;
  type: string; // Mime type
  url: string; // Data URL
}

export interface FeedGoal {
  id?: string; // Added optional ID for database-backed goals
  text: string;
  status: GoalStatus;
  attachment?: Attachment;
}

export interface User {
  id: string;
  name: string; // Corresponds to 'name' in public.users
  email: string; // Corresponds to 'email' in public.users
  avatar: string; // Corresponds to 'photo_url' in public.users, or a generated emoji/initials
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Comment {
  id: string;
  text: string;
  timestamp: string;
  userId: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  timestamp: string;
  type: 'morning' | 'evening';
  focus: string;
  goals: FeedGoal[];
  eveningRecap?: string;
  comments: Comment[];
  reactions: Reaction[];
}

export interface Notification {
  id: string;
  type: 'reaction' | 'comment';
  fromUserId: string;
  checkInId: string;
  timestamp: string;
  read: boolean;
}

export interface Pod {
  id: string;
  name: string;
  members: User[];
  checkIns: CheckIn[];
  notifications: Notification[];
}