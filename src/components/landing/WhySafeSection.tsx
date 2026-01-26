import { Shield, Eye, Bot, Key, UserCheck, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'No Bots or Automation',
    description: 'Every engagement is performed by real humans—no scripts or fake accounts.',
    gradient: 'from-red-500/20 to-orange-500/20',
  },
  {
    icon: Key,
    title: 'No Account Access',
    description: 'We never ask for your social media passwords or API credentials.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    icon: Eye,
    title: 'Manual Verification',
    description: 'Our trust system flags suspicious activity with random manual reviews.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    icon: UserCheck,
    title: 'Trust Score System',
    description: 'Users build reputation over time, ensuring quality engagements.',
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    icon: AlertTriangle,
    title: 'Report Abuse Option',
    description: 'Community-powered moderation keeps the platform clean and safe.',
    gradient: 'from-yellow-500/20 to-amber-500/20',
  },
  {
    icon: Shield,
    title: 'Platform Compliant',
    description: 'No TOS violations—just organic engagement from real users.',
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
];

export function WhySafeSection() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-success/5 rounded-full blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success mb-4 shadow-lg shadow-success/20">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">100% Safe & Ethical</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why EngageLoop Is <span className="text-gradient-primary">Safe</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've built our platform with integrity at the core. No shortcuts, no risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-in-up overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    {feature.title}
                    <CheckCircle className="w-4 h-4 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badge */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-card border border-success/30 shadow-lg shadow-success/10">
            <Shield className="w-10 h-10 text-success" />
            <div>
              <p className="font-semibold">Verified Safe Platform</p>
              <p className="text-sm text-muted-foreground">Trusted by 10,000+ creators worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
