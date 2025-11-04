/**
 * Core Flowkick Flows
 * Pre-built automation templates for common use cases
 */

export interface CoreFlow {
  id: string;
  name: string;
  description: string;
  category: 'engagement' | 'tracking' | 'marketing' | 'support';
  trigger: {
    type: 'story_share' | 'story_reply' | 'comment' | 'message' | 'keyword';
    description: string;
  };
  customFields: {
    name: string; // Standard flowkick naming convention
    type: 'number' | 'text' | 'date' | 'boolean';
    description: string;
    defaultValue?: any;
  }[];
  actions: {
    step: number;
    type: 'increment' | 'set_field' | 'send_message' | 'tag' | 'external_request';
    description: string;
    config: any;
  }[];
  setupInstructions: string[];
  manychatJson?: any; // Optional: Manychat flow export format
}

export const CORE_FLOWS: CoreFlow[] = [
  {
    id: 'story-share-tracker',
    name: '📊 Story Share Tracker',
    description: 'Track how many times users share your posts/reels as Instagram stories',
    category: 'tracking',
    trigger: {
      type: 'story_share',
      description: 'When user shares your Post or Reel as a Story',
    },
    customFields: [
      {
        name: 'flowkick-sharescountinsta',
        type: 'number',
        description: 'Total number of story shares by this user',
        defaultValue: 0,
      },
    ],
    actions: [
      {
        step: 1,
        type: 'increment',
        description: 'Increase share count by 1',
        config: {
          field: 'flowkick-sharescountinsta',
          operation: 'add',
          value: 1,
        },
      },
      {
        step: 2,
        type: 'send_message',
        description: 'Thank user for sharing',
        config: {
          message: '🎉 Thanks for sharing! You\'ve shared {{flowkick-sharescountinsta}} times.',
        },
      },
    ],
    setupInstructions: [
      '1. Go to Automation → Instagram → Post or Reel Share',
      '2. Create trigger: "User shares your Post or Reel as a Story"',
      '3. Add Action: "Set User Field"',
      '4. Select field: flowkick-sharescountinsta',
      '5. Operation: "Increase by 1"',
      '6. Add Action: "Send Message" (optional thank you message)',
    ],
  },
  {
    id: 'story-reply-tracker',
    name: '💬 Story Reply Tracker',
    description: 'Track how many times users reply to your Instagram stories',
    category: 'tracking',
    trigger: {
      type: 'story_reply',
      description: 'When user replies to your Instagram Story',
    },
    customFields: [
      {
        name: 'flowkick-storyrepcountinsta',
        type: 'number',
        description: 'Total number of story replies by this user',
        defaultValue: 0,
      },
    ],
    actions: [
      {
        step: 1,
        type: 'increment',
        description: 'Increase story reply count by 1',
        config: {
          field: 'flowkick-storyrepcountinsta',
          operation: 'add',
          value: 1,
        },
      },
      {
        step: 2,
        type: 'send_message',
        description: 'Respond to user',
        config: {
          message: '👋 Thanks for your reply! Total replies: {{flowkick-storyrepcountinsta}}',
        },
      },
    ],
    setupInstructions: [
      '1. Go to Automation → Instagram → Story Reply',
      '2. Create trigger: "User replies to your Story"',
      '3. Add Action: "Set User Field"',
      '4. Select field: flowkick-storyrepcountinsta',
      '5. Operation: "Increase by 1"',
      '6. Add Action: "Send Message" (optional response)',
    ],
  },
  {
    id: 'comment-tracker',
    name: '💭 Comment Tracker',
    description: 'Track how many times users comment on your Instagram posts',
    category: 'tracking',
    trigger: {
      type: 'comment',
      description: 'When user comments on your Instagram post',
    },
    customFields: [
      {
        name: 'flowkick-commentcountinsta',
        type: 'number',
        description: 'Total number of comments by this user',
        defaultValue: 0,
      },
    ],
    actions: [
      {
        step: 1,
        type: 'increment',
        description: 'Increase comment count by 1',
        config: {
          field: 'flowkick-commentcountinsta',
          operation: 'add',
          value: 1,
        },
      },
      {
        step: 2,
        type: 'send_message',
        description: 'Thank user for commenting',
        config: {
          message: '💬 Thanks for commenting! Total comments: {{flowkick-commentcountinsta}}',
        },
      },
    ],
    setupInstructions: [
      '1. Go to Automation → Instagram → Comment',
      '2. Create trigger: "User comments on your post"',
      '3. Add Action: "Set User Field"',
      '4. Select field: flowkick-commentcountinsta',
      '5. Operation: "Increase by 1"',
      '6. Add Action: "Send Message" (optional thank you)',
    ],
  },
  {
    id: 'first-time-story-share',
    name: '🎁 First Time Story Share Reward',
    description: 'Send special reward when user shares to story for the first time',
    category: 'marketing',
    trigger: {
      type: 'story_share',
      description: 'When user shares your Post or Reel as a Story',
    },
    customFields: [
      {
        name: 'flowkick-sharescountinsta',
        type: 'number',
        description: 'Total number of story shares',
        defaultValue: 0,
      },
      {
        name: 'flowkick-firstshare-rewarded',
        type: 'boolean',
        description: 'Whether user received first share reward',
        defaultValue: false,
      },
    ],
    actions: [
      {
        step: 1,
        type: 'increment',
        description: 'Increase share count',
        config: {
          field: 'flowkick-sharescountinsta',
          operation: 'add',
          value: 1,
        },
      },
      {
        step: 2,
        type: 'external_request',
        description: 'Generate QR code reward (if first share)',
        config: {
          url: 'https://flowkick.kua.cl/api/qr/generate',
          method: 'POST',
          condition: 'flowkick-sharescountinsta == 1',
        },
      },
      {
        step: 3,
        type: 'send_message',
        description: 'Send reward message with QR code',
        config: {
          message: '🎉 First share! Here\'s your exclusive discount code!',
          image: '{{qr_image_url}}',
        },
      },
    ],
    setupInstructions: [
      '1. Create a QR Code tool in Flowkick admin',
      '2. Go to Automation → Instagram → Post or Reel Share',
      '3. Add Action: Set User Field (flowkick-sharescountinsta, increase by 1)',
      '4. Add Condition: if flowkick-sharescountinsta == 1',
      '5. Add Action: External Request to Flowkick QR generate endpoint',
      '6. Add Action: Send Message with QR code image',
    ],
  },
  {
    id: 'engagement-milestone',
    name: '🏆 Engagement Milestone Rewards',
    description: 'Reward users when they hit engagement milestones (5, 10, 25 interactions)',
    category: 'marketing',
    trigger: {
      type: 'story_share',
      description: 'Any engagement trigger (shares, replies, comments)',
    },
    customFields: [
      {
        name: 'flowkick-totalengagement',
        type: 'number',
        description: 'Total engagement count (shares + replies + comments)',
        defaultValue: 0,
      },
      {
        name: 'flowkick-milestone-5',
        type: 'boolean',
        description: 'Whether 5-engagement milestone was reached',
        defaultValue: false,
      },
      {
        name: 'flowkick-milestone-10',
        type: 'boolean',
        description: 'Whether 10-engagement milestone was reached',
        defaultValue: false,
      },
      {
        name: 'flowkick-milestone-25',
        type: 'boolean',
        description: 'Whether 25-engagement milestone was reached',
        defaultValue: false,
      },
    ],
    actions: [
      {
        step: 1,
        type: 'increment',
        description: 'Increase total engagement',
        config: {
          field: 'flowkick-totalengagement',
          operation: 'add',
          value: 1,
        },
      },
      {
        step: 2,
        type: 'send_message',
        description: 'Send milestone reward (with conditions)',
        config: {
          conditions: [
            'flowkick-totalengagement == 5 AND flowkick-milestone-5 == false',
            'flowkick-totalengagement == 10 AND flowkick-milestone-10 == false',
            'flowkick-totalengagement == 25 AND flowkick-milestone-25 == false',
          ],
        },
      },
    ],
    setupInstructions: [
      '1. Create flowkick-totalengagement custom field',
      '2. On each engagement trigger, increase this field by 1',
      '3. Add conditions to check milestones (5, 10, 25)',
      '4. Send reward messages and set milestone flags to true',
      '5. Connect to Flowkick QR/booking tools for rewards',
    ],
  },
];

export function getCoreFlowById(id: string): CoreFlow | undefined {
  return CORE_FLOWS.find((flow) => flow.id === id);
}

export function getCoreFlowsByCategory(category: CoreFlow['category']): CoreFlow[] {
  return CORE_FLOWS.filter((flow) => flow.category === category);
}

export function getAllCustomFieldNames(): string[] {
  const fields = new Set<string>();
  CORE_FLOWS.forEach((flow) => {
    flow.customFields.forEach((field) => {
      fields.add(field.name);
    });
  });
  return Array.from(fields);
}
