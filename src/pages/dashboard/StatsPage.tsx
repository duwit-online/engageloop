import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { BarChart3, TrendingUp, TrendingDown, Users, Calendar } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const weeklyData = [
  { day: 'Mon', earned: 45, spent: 30 },
  { day: 'Tue', earned: 60, spent: 45 },
  { day: 'Wed', earned: 35, spent: 20 },
  { day: 'Thu', earned: 80, spent: 55 },
  { day: 'Fri', earned: 95, spent: 70 },
  { day: 'Sat', earned: 50, spent: 25 },
  { day: 'Sun', earned: 70, spent: 40 },
];

const engagementData = [
  { type: 'Likes', value: 245, color: 'hsl(var(--primary))' },
  { type: 'Comments', value: 89, color: 'hsl(var(--accent))' },
  { type: 'Follows', value: 156, color: 'hsl(var(--success))' },
  { type: 'Streams', value: 78, color: 'hsl(var(--capsule))' },
];

const monthlyActivity = [
  { week: 'Week 1', tasks: 23 },
  { week: 'Week 2', tasks: 34 },
  { week: 'Week 3', tasks: 28 },
  { week: 'Week 4', tasks: 41 },
];

const StatsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Stats & Analytics</h2>
        <p className="text-muted-foreground">Track your engagement performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <CapsuleBadge amount={435} size="sm" showPlus />
            </div>
            <p className="text-2xl font-bold mt-4">435</p>
            <p className="text-sm text-muted-foreground">Earned This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-accent" />
              </div>
              <CapsuleBadge amount={285} size="sm" />
            </div>
            <p className="text-2xl font-bold mt-4">285</p>
            <p className="text-sm text-muted-foreground">Spent This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4">89</p>
            <p className="text-sm text-muted-foreground">Tasks Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-capsule/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-capsule" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-4">568</p>
            <p className="text-sm text-muted-foreground">Engagements Received</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earned vs Spent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Capsules: Earned vs Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="earnedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="spentGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="earned"
                    stroke="hsl(var(--success))"
                    fill="url(#earnedGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    stroke="hsl(var(--accent))"
                    fill="url(#spentGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagements Received by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engagementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {engagementData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {engagementData.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.type}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Task Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tasks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsPage;
