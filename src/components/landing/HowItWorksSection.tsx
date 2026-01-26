import { Card, CardContent } from '@/components/ui/card';
import { Link2, MousePointer, TrendingUp, Wallet, ArrowDown, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Sign Up & Get Capsules',
    description: 'Create a free account and receive 200 bonus Capsules to get started.',
    color: 'text-capsule',
    bgColor: 'bg-capsule/10',
    borderColor: 'border-capsule/30',
  },
  {
    icon: Link2,
    title: 'Submit Your Links',
    description: 'Share any public link—social posts, videos, music, or websites.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  },
  {
    icon: MousePointer,
    title: 'Engage & Earn',
    description: 'Complete tasks for other users and earn Capsules with every engagement.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/30',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Reach',
    description: 'Spend Capsules to get real engagement from community members.',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-capsule/5 rounded-full blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Simple 4-Step Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How <span className="text-gradient-primary">EngageLoop</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple, fair exchange system where everyone benefits from genuine human engagement.
          </p>
        </div>

        {/* Desktop: Horizontal timeline */}
        <div className="hidden lg:block relative">
          {/* Connection line */}
          <div className="absolute top-24 left-[12%] right-[12%] h-1 bg-gradient-to-r from-capsule via-primary via-accent to-success rounded-full opacity-30" />
          
          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step number bubble */}
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center font-bold text-lg ${step.color} shadow-lg z-10`}>
                  {index + 1}
                </div>

                <Card className={`pt-10 mt-4 group hover:shadow-lg transition-all duration-300 border-border/50 hover:${step.borderColor} bg-card relative overflow-hidden`}>
                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 ${step.bgColor} opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                  
                  <CardContent className="p-6 text-center relative z-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.bgColor} mb-4 ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative pl-16 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Vertical line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-14 w-0.5 h-[calc(100%+24px)] bg-gradient-to-b from-primary/50 to-transparent" />
              )}

              {/* Step number */}
              <div className={`absolute left-0 top-0 w-12 h-12 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center font-bold text-lg ${step.color} shadow-lg`}>
                {index + 1}
              </div>

              <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center ${step.color}`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Visual arrow indicator */}
        <div className="flex justify-center mt-12">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted/50 text-muted-foreground">
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span className="text-sm">Keep scrolling to learn more</span>
          </div>
        </div>
      </div>
    </section>
  );
}
