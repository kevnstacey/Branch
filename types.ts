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
  text: string;
  status: GoalStatus;
  attachment?: Attachment;
}

export interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or Initials
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