// Trust Score System
export type TrustTier = 'trusted' | 'normal' | 'restricted' | 'suspended';

export interface TrustConfig {
  tier: TrustTier;
  label: string;
  color: string;
  minScore: number;
  maxScore: number;
  dailyEarningCap: number | null;
  pendingDuration: number; // hours
  screenshotRequired: boolean;
  timerMultiplier: number;
}

export const trustTiers: Record<TrustTier, TrustConfig> = {
  trusted: {
    tier: 'trusted',
    label: 'Trusted',
    color: 'text-success',
    minScore: 80,
    maxScore: 100,
    dailyEarningCap: null,
    pendingDuration: 10 / 60, // 10 minutes in hours
    screenshotRequired: true,
    timerMultiplier: 0.8,
  },
  normal: {
    tier: 'normal',
    label: 'Normal',
    color: 'text-primary',
    minScore: 50,
    maxScore: 79,
    dailyEarningCap: null,
    pendingDuration: 30 / 60, // 30 minutes in hours
    screenshotRequired: true,
    timerMultiplier: 1,
  },
  restricted: {
    tier: 'restricted',
    label: 'Restricted',
    color: 'text-warning',
    minScore: 20,
    maxScore: 49,
    dailyEarningCap: 50,
    pendingDuration: 2, // 2 hours
    screenshotRequired: true,
    timerMultiplier: 1.5,
  },
  suspended: {
    tier: 'suspended',
    label: 'Suspended',
    color: 'text-destructive',
    minScore: 0,
    maxScore: 19,
    dailyEarningCap: 0,
    pendingDuration: 0,
    screenshotRequired: true,
    timerMultiplier: 2,
  },
};

export function getTrustTier(score: number): TrustConfig {
  if (score >= 80) return trustTiers.trusted;
  if (score >= 50) return trustTiers.normal;
  if (score >= 20) return trustTiers.restricted;
  return trustTiers.suspended;
}

// Task States
export type TaskState = 'started' | 'pending' | 'verified' | 'released' | 'reversed' | 'flagged';

export interface TaskStateConfig {
  state: TaskState;
  label: string;
  description: string;
  color: string;
}

export const taskStates: Record<TaskState, TaskStateConfig> = {
  started: {
    state: 'started',
    label: 'Started',
    description: 'User has started the task',
    color: 'text-muted-foreground',
  },
  pending: {
    state: 'pending',
    label: 'Pending',
    description: 'Awaiting validation',
    color: 'text-warning',
  },
  verified: {
    state: 'verified',
    label: 'Verified',
    description: 'Task verified successfully',
    color: 'text-primary',
  },
  released: {
    state: 'released',
    label: 'Released',
    description: 'Capsules credited to account',
    color: 'text-success',
  },
  reversed: {
    state: 'reversed',
    label: 'Reversed',
    description: 'Task reversed, capsules removed',
    color: 'text-destructive',
  },
  flagged: {
    state: 'flagged',
    label: 'Flagged',
    description: 'Under review for potential abuse',
    color: 'text-destructive',
  },
};

// Task Validation Rules - ALL require username (except website), screenshot, and content question
export interface ValidationRule {
  taskType: string;
  minTimer: number; // seconds
  maxTimer: number;
  requiresComment: boolean;
  requiresUsername: boolean; // Now true for all except website
  requiresContentQuestion: boolean; // Now true for all
  screenshotChance: number; // Now 1 (100%) for all
}

export const validationRules: Record<string, ValidationRule> = {
  like: {
    taskType: 'like',
    minTimer: 15,
    maxTimer: 25,
    requiresComment: false,
    requiresUsername: true, // Mandatory
    requiresContentQuestion: true, // Mandatory
    screenshotChance: 1, // 100% mandatory
  },
  comment: {
    taskType: 'comment',
    minTimer: 30,
    maxTimer: 60,
    requiresComment: true,
    requiresUsername: true, // Mandatory
    requiresContentQuestion: true, // Mandatory
    screenshotChance: 1, // 100% mandatory
  },
  follow: {
    taskType: 'follow',
    minTimer: 20,
    maxTimer: 30,
    requiresComment: false,
    requiresUsername: true, // Mandatory
    requiresContentQuestion: true, // Mandatory
    screenshotChance: 1, // 100% mandatory
  },
  stream: {
    taskType: 'stream',
    minTimer: 60,
    maxTimer: 120,
    requiresComment: false,
    requiresUsername: true, // Mandatory
    requiresContentQuestion: true, // Mandatory
    screenshotChance: 1, // 100% mandatory
  },
  visit: {
    taskType: 'visit',
    minTimer: 10,
    maxTimer: 20,
    requiresComment: false,
    requiresUsername: false, // Not needed for website visits
    requiresContentQuestion: true, // Still need to verify they visited
    screenshotChance: 1, // 100% mandatory
  },
};

// Penalty System
export interface Penalty {
  type: 'holdback' | 'slashing' | 'cooldown' | 'permanent';
  label: string;
  description: string;
  value: number | string;
}

export const penalties: Penalty[] = [
  {
    type: 'holdback',
    label: 'Capsule Holdback',
    description: '5-10% of capsules held for delayed release',
    value: '5-10%',
  },
  {
    type: 'slashing',
    label: 'Capsule Slashing',
    description: 'Reversed tasks remove more capsules than earned',
    value: '150%',
  },
  {
    type: 'cooldown',
    label: 'Earning Freeze',
    description: '24-72 hour earning freeze after repeated abuse',
    value: '24-72h',
  },
  {
    type: 'permanent',
    label: 'Permanent Restriction',
    description: 'Account permanently restricted after multiple severe offenses',
    value: 'Permanent',
  },
];

// Trust Score Adjustment
export interface TrustAdjustment {
  action: string;
  points: number;
  description: string;
}

export const trustAdjustments: TrustAdjustment[] = [
  { action: 'task_verified', points: 2, description: 'Task verified without dispute' },
  { action: 'consistent_completion', points: 1, description: 'Consistent completion times' },
  { action: 'no_reversals', points: 3, description: 'No reversals over extended period' },
  { action: 'community_confirmation', points: 2, description: 'Community confirmation received' },
  { action: 'task_reversed', points: -7, description: 'Task reversed' },
  { action: 'dispute_raised', points: -3, description: 'Dispute raised against user' },
  { action: 'unrealistic_speed', points: -5, description: 'Unrealistic task speed detected' },
  { action: 'duplicate_content', points: -4, description: 'Duplicate comments or screenshots' },
  { action: 'abuse_report', points: -10, description: 'Abuse report confirmed' },
];

// Dynamic Random Content Questions for ALL task types - Large pool for variety
export const taskQuestions: Record<string, string[]> = {
  like: [
    'What is the main subject of the post?',
    'What colors are prominent in the content?',
    'Is there text visible in the post? Describe it briefly.',
    'What type of content is this (photo, video, reel)?',
    'What emotion does the content convey?',
    'How many people/objects are visible in the post?',
    'What is the background setting of the content?',
    'Is there a logo or brand visible? Which one?',
    'What action is happening in the content?',
    'Describe the lighting in the post (bright, dark, colorful)?',
    'What language is the caption written in?',
    'Is the content indoor or outdoor?',
    'What time of day does the content appear to be from?',
    'Are there any emojis in the caption? Which ones?',
    'What is the first word of the caption?',
  ],
  comment: [
    'What topic is the post about?',
    'Who is the creator of this content?',
    'What hashtags are used in the post (name any 2)?',
    'What is the call-to-action in the content?',
    'Describe the thumbnail or main image briefly.',
    'How many comments are visible on the post?',
    'What is the tone of the post (funny, serious, informative)?',
    'Is there a question asked in the caption?',
    'What industry or niche is this content about?',
    'Are there any mentions/tags in the post?',
    'What format is the post (carousel, single, video)?',
    'What is the last word of the caption?',
    'Is there a link in the bio mentioned?',
    'What emotion should the audience feel?',
    'Is music playing in the content? What genre?',
  ],
  follow: [
    'What type of content does this account post?',
    'What is the account\'s bio about?',
    'How many posts does the account have (approximate)?',
    'What niche or industry is this account in?',
    'What is unique about this profile?',
    'What is the profile picture showing?',
    'How many followers does the account have (approximate)?',
    'Is the account verified?',
    'What is the account\'s username exactly?',
    'What country/location is mentioned in bio?',
    'Is there a website link in the bio?',
    'What is the first highlight cover about?',
    'What is the most recent post about?',
    'Does the bio contain any emojis? Which ones?',
    'Is it a personal or business account?',
  ],
  stream: [
    'What phrase is repeated in the chorus?',
    'What topic is discussed after the intro?',
    'What is the main subject of the content?',
    'What call-to-action does the creator use?',
    'Describe one key moment from the content.',
    'How long is the video/audio content?',
    'What is the creator wearing or their setup?',
    'What genre/category is this content?',
    'Is there background music? Describe it.',
    'What is mentioned in the first 30 seconds?',
    'How many views/listens does it have?',
    'What is the thumbnail showing?',
    'Is there a sponsor mentioned?',
    'What language is the content in?',
    'What is the title of the content?',
    'Who is the main speaker/performer?',
    'What platform-specific features are used?',
  ],
  visit: [
    'What is the main purpose of this website?',
    'What color scheme does the website use?',
    'What is the main headline on the page?',
    'Is there a call-to-action button? What does it say?',
    'What product or service is featured?',
    'What is the company/brand name?',
    'Is there a navigation menu? Name 2 items.',
    'What images are on the homepage?',
    'Is there a footer? What links are there?',
    'What font style is used (modern, classic)?',
    'Is there a logo? Describe it.',
    'Is there pricing information visible?',
    'What contact information is shown?',
    'Is there a signup/login button?',
    'What language is the website in?',
    'Is the website mobile-friendly?',
  ],
};

// Generate a fresh random question each time - ensures variety
export function getRandomTaskQuestion(taskType: string): string {
  const questions = taskQuestions[taskType] || taskQuestions.like;
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

// Username verification helper - for public profile checking
export interface UsernameVerification {
  platform: string;
  username: string;
  verificationUrl: string;
  publicCheckable: boolean;
}

export function generateVerificationUrl(platform: string, username: string): UsernameVerification {
  const cleanUsername = username.replace(/^@/, '').trim();
  
  const platformUrls: Record<string, { url: string; checkable: boolean }> = {
    'Instagram': { url: `https://instagram.com/${cleanUsername}`, checkable: true },
    'Facebook': { url: `https://facebook.com/${cleanUsername}`, checkable: true },
    'X (Twitter)': { url: `https://x.com/${cleanUsername}`, checkable: true },
    'Twitter': { url: `https://x.com/${cleanUsername}`, checkable: true },
    'YouTube': { url: `https://youtube.com/@${cleanUsername}`, checkable: true },
    'TikTok': { url: `https://tiktok.com/@${cleanUsername}`, checkable: true },
    'LinkedIn': { url: `https://linkedin.com/in/${cleanUsername}`, checkable: true },
    'GitHub': { url: `https://github.com/${cleanUsername}`, checkable: true },
    'Threads': { url: `https://threads.net/@${cleanUsername}`, checkable: true },
    'Pinterest': { url: `https://pinterest.com/${cleanUsername}`, checkable: true },
    'Spotify': { url: `https://open.spotify.com/user/${cleanUsername}`, checkable: false },
    'Twitch': { url: `https://twitch.tv/${cleanUsername}`, checkable: true },
    'SoundCloud': { url: `https://soundcloud.com/${cleanUsername}`, checkable: true },
  };
  
  const config = platformUrls[platform] || { url: '', checkable: false };
  
  return {
    platform,
    username: cleanUsername,
    verificationUrl: config.url,
    publicCheckable: config.checkable,
  };
}

// Legacy function for backward compatibility
export function getRandomStreamQuestion(): string {
  return getRandomTaskQuestion('stream');
}
