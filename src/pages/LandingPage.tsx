import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhySafeSection } from '@/components/landing/WhySafeSection';
import { PlatformsSection } from '@/components/landing/PlatformsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FooterSection } from '@/components/landing/FooterSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <Navbar />
      <main className="w-full">
        <HeroSection />
        <HowItWorksSection />
        <WhySafeSection />
        <PlatformsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default LandingPage;
