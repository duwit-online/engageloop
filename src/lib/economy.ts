export type TaskType = 'like' | 'comment' | 'follow' | 'stream';

export const taskValues: Record<TaskType, number> = {
  like: 5,
  comment: 10,
  follow: 15,
  stream: 15,
};

export const COMBO_BONUS = 15;
export const COMBO_TOTAL = 60;

export const taskLabels: Record<TaskType, string> = {
  like: 'Like',
  comment: 'Comment',
  follow: 'Follow',
  stream: 'Stream/Watch',
};

export const taskIcons: Record<TaskType, string> = {
  like: 'heart',
  comment: 'message-circle',
  follow: 'user-plus',
  stream: 'play',
};

export interface Plan {
  id: string;
  name: string;
  monthlyAllowance: number;
  dailyLimit: number | null;
  signupBonus: number;
  multiplier: number;
  adsEnabled: boolean;
  batchTasks: boolean;
  priceMonthly: number;
  features: string[];
}

export const plans: Record<string, Plan> = {
  freemium: {
    id: 'freemium',
    name: 'Freemium',
    monthlyAllowance: 1500,
    dailyLimit: 100,
    signupBonus: 200,
    multiplier: 1,
    adsEnabled: true,
    batchTasks: false,
    priceMonthly: 0,
    features: [
      '1,500 Capsules/month',
      '100 Capsules daily limit',
      '200 Signup bonus',
      '1x earning multiplier',
      'Standard support',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    monthlyAllowance: 6000,
    dailyLimit: null,
    signupBonus: 200,
    multiplier: 1.5,
    adsEnabled: false,
    batchTasks: true,
    priceMonthly: 3000,
    features: [
      '6,000 Capsules/month',
      'No daily spending limit',
      '200 Signup bonus',
      '1.5x earning multiplier',
      'Ad-free experience',
      'Priority 24/7 support',
      'Batch tasks enabled',
      'One-click auto-tasking UI',
    ],
  },
};

export const subscriptionDurations = [
  { months: 1, label: 'Monthly', discount: 0 },
  { months: 3, label: 'Quarterly', discount: 0.1 },
  { months: 6, label: 'Biannual', discount: 0.15 },
  { months: 12, label: 'Annual', discount: 0.25 },
];

export const capsulePackages = [
  { capsules: 100, priceNGN: 500, label: 'Starter' },
  { capsules: 500, priceNGN: 2000, label: 'Popular' },
  { capsules: 1500, priceNGN: 5000, label: 'Best Value', featured: true },
];

export function calculateTaskReward(
  tasks: TaskType[],
  multiplier: number = 1
): { subtotal: number; bonus: number; total: number } {
  const subtotal = tasks.reduce((sum, task) => sum + taskValues[task], 0);
  const isCombo = tasks.length === 4;
  const bonus = isCombo ? COMBO_BONUS : 0;
  const total = Math.floor((subtotal + bonus) * multiplier);
  return { subtotal, bonus, total };
}
