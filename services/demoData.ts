// services/demoData.ts
import { Pod, GoalStatus } from '../types';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);

export const demoPods: { [key: string]: Pod } = {
  'p1': {
    id: 'p1',
    name: 'Okanagan Founders',
    members: [
      { id: 'u1', name: 'Kevin', avatar: '👨‍💻' },
      { id: 'u2', name: 'Aria', avatar: '🎨' },
      { id: 'u3', name: 'Marc', avatar: '📈' },
    ],
    checkIns: [
       {
        id: 'c4', userId: 'u1', timestamp: today.toISOString(), type: 'morning',
        focus: 'Follow up with Polson Market lead',
        goals: [
          { text: 'Deploy yesterday\'s work to staging', status: GoalStatus.Partial },
          { text: 'Draft follow-up email', status: GoalStatus.Partial },
          { text: '45m cardio session', status: GoalStatus.Partial },
        ],
        comments: [], reactions: [],
      },
      {
        id: 'c1-e', userId: 'u1', timestamp: yesterday.toISOString(), type: 'evening',
        focus: 'Ship Community Connect landing page',
        goals: [
          { text: 'Finalize hero section copy', status: GoalStatus.Done },
          { text: 'Implement responsive mobile layout', status: GoalStatus.Done },
          { text: 'Deploy to staging for review', status: GoalStatus.Partial },
        ],
        eveningRecap: "Mobile layout took longer than expected. Staging deploy will have to be tomorrow morning.",
        comments: [
            { id: 'c1-e-1', userId: 'u2', text: "That's still huge progress! The mobile version looks great.", timestamp: new Date(yesterday.getTime() + 30*60000).toISOString() }
        ], 
        reactions: [{ userId: 'u2', emoji: '🙌' }, { userId: 'u3', emoji: '👍' }],
      },
       {
        id: 'c2-e', userId: 'u2', timestamp: yesterday.toISOString(), type: 'evening',
        focus: 'Draft volunteer app prompt v2',
        goals: [
          { text: 'Review feedback on v1', status: GoalStatus.Done },
          { text: 'Create 3 new prompt variations', status: GoalStatus.Partial },
          { text: 'Send to Marc for a quick look', status: GoalStatus.Skipped },
        ],
        eveningRecap: "Got through the feedback and drafted some good ideas, but ran out of time to send to Marc. Pushing that to tomorrow.",
        comments: [ { id: 'c2-e-1', userId: 'u1', text: "Solid work, Aria! Tomorrow is a new day.", timestamp: new Date(yesterday.getTime() + 2*60*60000).toISOString() } ], 
        reactions: [{ userId: 'u1', emoji: '👍' }],
      },
      {
        id: 'c3', userId: 'u3', timestamp: twoDaysAgo.toISOString(), type: 'morning',
        focus: 'Client proposal outline',
        goals: [
          { text: 'Research competitor pricing', status: GoalStatus.Partial },
          { text: 'Structure the project timeline', status: GoalStatus.Partial },
          { text: 'Write the executive summary', status: GoalStatus.Partial },
        ],
        comments: [{ id: 'c3-1', userId: 'u1', text: "Good luck with the proposal!", timestamp: new Date(twoDaysAgo.getTime() + 30*60000).toISOString() }],
        reactions: [{ userId: 'u1', emoji: '💪' }],
      },
       {
        id: 'c2', userId: 'u2', timestamp: twoDaysAgo.toISOString(), type: 'morning',
        focus: 'Draft volunteer app prompt v2',
        goals: [
          { text: 'Review feedback on v1', status: GoalStatus.Partial },
          { text: 'Create 3 new prompt variations', status: GoalStatus.Partial },
          { text: 'Send to Marc for a quick look', status: GoalStatus.Partial },
        ],
        comments: [], reactions: [],
      },
    ],
    notifications: [
        { id: 'n1', fromUserId: 'u2', checkInId: 'c1-e', type: 'comment', timestamp: new Date(yesterday.getTime() + 30*60000).toISOString(), read: false },
        { id: 'n2', fromUserId: 'u3', checkInId: 'c1-e', type: 'reaction', timestamp: new Date(yesterday.getTime() + 35*60000).toISOString(), read: false },
        { id: 'n3', fromUserId: 'u1', checkInId: 'c3', type: 'comment', timestamp: new Date(twoDaysAgo.getTime() + 30*60000).toISOString(), read: true },
        { id: 'n7', fromUserId: 'u1', checkInId: 'c2-e', type: 'comment', timestamp: new Date(yesterday.getTime() + 2*60*60000).toISOString(), read: false },
    ],
  },
  'p2': {
    id: 'p2',
    name: 'Cross-Country Crew',
    members: [
      { id: 'u4', name: 'Elena', avatar: '🔬' },
      { id: 'u5', name: 'Sam', avatar: '🛠️' },
      { id: 'u6', name: 'Priya', avatar: '⚖️' },
      { id: 'u7', name: 'Tom', avatar: '🌱' },
    ],
    checkIns: [
      {
        id: 'cc2-e', userId: 'u5', timestamp: yesterday.toISOString(), type: 'evening',
        focus: 'Finish custom bookshelf installation',
        goals: [
          { text: 'Cut and sand final two shelves', status: GoalStatus.Done },
          { text: 'Apply first coat of stain', status: GoalStatus.Done },
          { text: 'Clean up the workshop', status: GoalStatus.Done },
        ],
        eveningRecap: "Done! The stain came out perfectly. Client will be thrilled.",
        comments: [
            { id: 'cc2-e-1', userId: 'u4', text: "That's awesome, Sam! Congrats.", timestamp: new Date(yesterday.getTime() + 30*60000).toISOString() },
            { id: 'cc2-e-2', userId: 'u7', text: "Incredible work!", timestamp: new Date(yesterday.getTime() + 60*60000).toISOString() }
        ], 
        reactions: [{ userId: 'u4', emoji: '🙌' }, { userId: 'u7', emoji: '🛠️' }],
      },
      {
        id: 'cc1', userId: 'u4', timestamp: yesterday.toISOString(), type: 'morning',
        focus: 'Analyze lab results from batch #7',
        goals: [
          { text: 'Cross-reference data with control group', status: GoalStatus.Partial },
          { text: 'Generate initial charts', status: GoalStatus.Partial },
          { text: 'Write summary of findings', status: GoalStatus.Partial },
        ],
        comments: [], reactions: [],
      },
    ],
    notifications: [
        { id: 'n4', fromUserId: 'u4', checkInId: 'cc2-e', type: 'comment', timestamp: new Date(yesterday.getTime() + 30*60000).toISOString(), read: false },
    ],
  },
};
