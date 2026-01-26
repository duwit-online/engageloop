import { Button } from '@/components/ui/button';
import { CapsuleBadge } from '@/components/CapsuleBadge';
import { ArrowRight, Sparkles, Users, Shield, Play, Star, Zap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBranding } from '@/hooks/useBranding';
import heroBackground from '@/assets/hero-background.jpg';
import socialMockup from '@/assets/social-mockup.png';

// Geometric shapes component
function GeometricShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {/* Neon glowing orbs */}
      <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-32 right-[15%] w-96 h-96 bg-capsule/15 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] animate-float" />
      
      {/* Geometric shapes */}
      <div className="absolute top-32 right-[20%] w-20 h-20 border-2 border-primary/30 rotate-45 animate-spin-slow" />
      <div className="absolute bottom-40 left-[8%] w-16 h-16 border-2 border-capsule/40 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-[40%] right-[8%] w-24 h-24 border border-accent/30 rotate-12 animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-[30%] left-[25%] w-12 h-12 bg-primary/20 rotate-45 animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Floating dots */}
      <div className="absolute top-[25%] left-[30%] w-3 h-3 bg-primary rounded-full animate-float" />
      <div className="absolute top-[60%] right-[30%] w-2 h-2 bg-capsule rounded-full animate-float" style={{ animationDelay: '0.7s' }} />
      <div className="absolute bottom-[20%] right-[40%] w-4 h-4 bg-accent/60 rounded-full animate-float" style={{ animationDelay: '1.2s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
    </div>
  );
}

// Social proof screenshots mockup
function SocialProofSection() {
  return (
    <div className="hidden lg:flex absolute right-[5%] top-1/2 -translate-y-1/2 flex-col gap-4 z-[5]">
      <div 
        className="w-80 rounded-2xl overflow-hidden shadow-2xl border border-primary/20 animate-slide-in-right"
        style={{ animationDelay: '0.4s' }}
      >
        <img 
          src={socialMockup} 
          alt="Social media analytics dashboard showing engagement growth" 
          className="w-full h-auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
      
      {/* Floating stat cards */}
      <div className="absolute -left-20 top-10 w-40 p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-capsule/30 shadow-lg animate-float" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          <div>
            <p className="text-lg font-bold text-success">+340%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>
      </div>
      
      <div className="absolute -left-16 bottom-20 w-36 p-3 rounded-xl bg-card/90 backdrop-blur-lg border border-primary/30 shadow-lg animate-float" style={{ animationDelay: '0.8s' }}>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-capsule fill-capsule" />
          <div>
            <p className="text-lg font-bold">12.4K</p>
            <p className="text-xs text-muted-foreground">New Followers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats ticker
function StatsTicker() {
  const stats = [
    { icon: Users, value: '50K+', label: 'Active Users' },
    { icon: Zap, value: '2M+', label: 'Tasks Completed' },
    { icon: TrendingUp, value: '98%', label: 'Satisfaction' },
    { icon: Star, value: '4.9', label: 'Rating' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <stat.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSection() {
  const { branding } = useBranding();
  const backgroundImage = branding.background_image || heroBackground;

  const renderHeadline = () => {
    const headline = branding.hero_headline;
    const highlightPhrases = ['Real Human', 'real human'];
    
    for (const phrase of highlightPhrases) {
      if (headline.includes(phrase)) {
        const parts = headline.split(phrase);
        return (
          <>
            {parts[0]}
            <span className="text-gradient-primary relative">
              {phrase}
              <span className="absolute -inset-1 bg-primary/20 blur-xl -z-10 rounded-lg" />
            </span>
            {parts[1]}
          </>
        );
      }
    }
    
    return headline;
  };

  return (
    <section 
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-16"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/85 z-0" />

      <GeometricShapes />
      <SocialProofSection />

      <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 animate-fade-in shadow-glow">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">100% Human-Powered Engagement</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">NEW</span>
          </div>

          {/* Main headline with neon glow */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {renderHeadline()}
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {branding.hero_subheadline.split('Capsules').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="text-gradient-capsule font-semibold relative">
                    Capsules
                    <span className="absolute -inset-1 bg-capsule/20 blur-lg -z-10 rounded" />
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* CTA Buttons with hover effects */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button variant="gradient" size="xl" className="gap-2 group shadow-glow hover:shadow-[0_0_60px_hsl(var(--primary)/0.4)] transition-shadow duration-300">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="#how-it-works">
              <Button variant="glass" size="xl" className="gap-2 border-primary/30 hover:border-primary/60 transition-colors">
                <Play className="w-4 h-4" />
                How It Works
              </Button>
            </Link>
          </div>

          {/* Trust indicators with icons */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">10,000+ Active Users</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
              <Shield className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">100% Safe & Ethical</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-capsule/10 backdrop-blur-sm border border-capsule/30">
              <CapsuleBadge amount={200} size="sm" />
              <span className="text-sm font-medium">Free Signup Bonus</span>
            </div>
          </div>

          <StatsTicker />
        </div>
      </div>

      {/* Scroll indicator with neon glow */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2 shadow-glow">
          <div className="w-1.5 h-2.5 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
}
