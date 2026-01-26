import { platforms } from '@/lib/platforms';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Globe, Sparkles } from 'lucide-react';

export function PlatformsSection() {
  return (
    <section className="py-20 sm:py-32 bg-background overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-capsule/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Universal Compatibility</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Works With <span className="text-gradient-primary">Any Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Submit links from your favorite platforms—we support them all.
          </p>
        </div>

        {/* Platform grid for larger screens */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <PlatformIcon icon={platform.icon} size={28} />
              </div>
              <span className="font-medium text-sm">{platform.name}</span>
            </div>
          ))}
        </div>

        {/* Scrolling platforms for mobile */}
        <div className="md:hidden relative">
          <div className="flex gap-4 animate-scroll">
            {[...platforms, ...platforms].map((platform, index) => (
              <div
                key={`${platform.name}-${index}`}
                className="flex-shrink-0 flex items-center gap-3 px-5 py-4 rounded-xl bg-card border border-border/50"
              >
                <PlatformIcon icon={platform.icon} className="w-6 h-6" />
                <span className="font-medium whitespace-nowrap">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional platforms indicator */}
        <div className="flex justify-center mt-10">
          <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-muted/50 text-muted-foreground">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm">...and any other valid public URL!</span>
          </div>
        </div>

        {/* Floating platform previews */}
        <div className="hidden lg:block relative mt-16">
          <div className="flex justify-center gap-6">
            {[
              { name: 'Video Post', platform: 'TikTok', views: '125K', color: 'from-pink-500 to-purple-600' },
              { name: 'Reel', platform: 'Instagram', likes: '45K', color: 'from-orange-400 to-pink-500' },
              { name: 'Short', platform: 'YouTube', views: '89K', color: 'from-red-500 to-red-600' },
            ].map((item, index) => (
              <div
                key={item.platform}
                className="w-56 p-4 rounded-xl bg-card border border-border/50 shadow-lg animate-float"
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <div className={`w-full h-28 rounded-lg bg-gradient-to-br ${item.color} mb-3 flex items-center justify-center`}>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                  </div>
                </div>
                <p className="font-medium text-sm">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{item.platform}</span>
                  <span className="text-xs font-medium text-primary">{item.views || item.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 25s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
