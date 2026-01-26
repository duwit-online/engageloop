// Admin System Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'freemium' | 'premium';
  trustScore: number;
  accountType: 'individual' | 'organization';
  capsuleBalance: number;
  earnedTotal: number;
  spentTotal: number;
  createdAt: string;
  lastActive: string;
  status: 'active' | 'restricted' | 'suspended' | 'banned';
  flagCount: number;
}

export interface AbuseReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetName: string;
  taskId: string;
  reason: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AdZone {
  id: string;
  name: string;
  placement: 'header' | 'sidebar' | 'footer' | 'inline' | 'interstitial';
  type: 'script' | 'link' | 'banner';
  content: string;
  enabled: boolean;
  provider: string;
  impressions: number;
  clicks: number;
  revenue: number;
  createdAt: string;
}

export interface EconomyStats {
  totalCapsules: number;
  capsulesInCirculation: number;
  capsulesEarnedToday: number;
  capsulesSpentToday: number;
  averageTaskValue: number;
  activeUsers: number;
  tasksCompletedToday: number;
  fraudPreventedToday: number;
  revenueToday: number;
}

export interface TaskModeration {
  id: string;
  userId: string;
  userName: string;
  userTrustScore: number;
  taskType: string;
  platform: string;
  url: string;
  status: 'pending' | 'verified' | 'flagged' | 'reversed';
  capsuleReward: number;
  completedAt: string;
  screenshotUrl?: string;
  commentText?: string;
  flagReason?: string;
}

// Mock Data Generators
export function generateMockUsers(count: number): AdminUser[] {
  const names = ['Alex Johnson', 'Sarah Williams', 'Mike Chen', 'Emma Davis', 'James Wilson', 'Olivia Brown', 'David Lee', 'Sophia Garcia'];
  const statuses: AdminUser['status'][] = ['active', 'active', 'active', 'restricted', 'suspended'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    name: names[i % names.length],
    plan: Math.random() > 0.7 ? 'premium' : 'freemium',
    trustScore: Math.floor(Math.random() * 60) + 40,
    accountType: Math.random() > 0.8 ? 'organization' : 'individual',
    capsuleBalance: Math.floor(Math.random() * 2000) + 100,
    earnedTotal: Math.floor(Math.random() * 10000) + 500,
    spentTotal: Math.floor(Math.random() * 8000) + 200,
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    flagCount: Math.floor(Math.random() * 5),
  }));
}

export function generateMockReports(count: number): AbuseReport[] {
  const reasons = ['Fake engagement', 'Bot activity', 'Duplicate submission', 'Spam comments', 'Impersonation'];
  const statuses: AbuseReport['status'][] = ['pending', 'investigating', 'resolved', 'dismissed'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `report-${i + 1}`,
    reporterId: `user-${Math.floor(Math.random() * 10) + 1}`,
    reporterName: `Reporter ${i + 1}`,
    targetId: `user-${Math.floor(Math.random() * 10) + 1}`,
    targetName: `Target User ${i + 1}`,
    taskId: `task-${Math.floor(Math.random() * 100) + 1}`,
    reason: reasons[Math.floor(Math.random() * reasons.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}

export function generateMockAdZones(): AdZone[] {
  return [
    {
      id: 'ad-1',
      name: 'Header Banner',
      placement: 'header',
      type: 'banner',
      content: '<img src="/placeholder.svg" alt="Ad" />',
      enabled: true,
      provider: 'AdSense',
      impressions: 45230,
      clicks: 1205,
      revenue: 125.50,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ad-2',
      name: 'Sidebar Ad',
      placement: 'sidebar',
      type: 'script',
      content: '<!-- Adsterra script -->',
      enabled: true,
      provider: 'Adsterra',
      impressions: 32100,
      clicks: 890,
      revenue: 89.20,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ad-3',
      name: 'Footer Banner',
      placement: 'footer',
      type: 'link',
      content: 'https://sponsor.example.com',
      enabled: false,
      provider: 'Custom Sponsor',
      impressions: 18500,
      clicks: 425,
      revenue: 250.00,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ad-4',
      name: 'Task Interstitial',
      placement: 'interstitial',
      type: 'script',
      content: '<!-- Interstitial ad script -->',
      enabled: true,
      provider: 'AdSense',
      impressions: 12800,
      clicks: 560,
      revenue: 78.40,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

export function generateMockEconomyStats(): EconomyStats {
  return {
    totalCapsules: 2450000,
    capsulesInCirculation: 1890000,
    capsulesEarnedToday: 45200,
    capsulesSpentToday: 38900,
    averageTaskValue: 12.5,
    activeUsers: 3240,
    tasksCompletedToday: 8950,
    fraudPreventedToday: 156,
    revenueToday: 543.20,
  };
}

export function generateMockTasks(count: number): TaskModeration[] {
  const types = ['like', 'comment', 'follow', 'stream'];
  const platforms = ['Instagram', 'YouTube', 'TikTok', 'Twitter', 'Facebook'];
  const statuses: TaskModeration['status'][] = ['pending', 'verified', 'flagged', 'reversed'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i + 1}`,
    userId: `user-${Math.floor(Math.random() * 10) + 1}`,
    userName: `User ${Math.floor(Math.random() * 10) + 1}`,
    userTrustScore: Math.floor(Math.random() * 60) + 40,
    taskType: types[Math.floor(Math.random() * types.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    url: `https://example.com/post/${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    capsuleReward: [5, 10, 15, 15][Math.floor(Math.random() * 4)],
    completedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    flagReason: Math.random() > 0.7 ? 'Suspicious activity pattern' : undefined,
  }));
}
