import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBranding } from '@/hooks/useBranding';
import { Twitter, Facebook, Instagram, Youtube, MessageCircle } from 'lucide-react';

export function FooterSection() {
  const { branding } = useBranding();
  const socialLinks = branding.social_links || {};

  const hasSocialLinks = Object.values(socialLinks).some(v => v);

  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container mx-auto px-4">
        {/* CTA */}
        <div className="text-center mb-12 p-8 rounded-2xl gradient-primary">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Grow Your Audience?
          </h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Join thousands of creators using {branding.app_name} to build real engagement.
          </p>
          <Link to="/signup">
            <Button variant="glass" size="lg" className="bg-background/20 hover:bg-background/30 text-primary-foreground border-primary-foreground/20">
              Start Free Today
            </Button>
          </Link>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              <li><Link to="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.app_name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {branding.app_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-display font-bold text-lg">{branding.app_name}</span>
          </div>

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex items-center gap-3">
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {socialLinks.discord && (
                <a href={socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} {branding.app_name}. All rights reserved.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-8 max-w-2xl mx-auto">
          {branding.footer_disclaimer}
        </p>
      </div>
    </footer>
  );
}
