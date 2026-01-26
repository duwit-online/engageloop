import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  discord?: string;
  tiktok?: string;
  linkedin?: string;
}

export interface Branding {
  app_name: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  hero_headline: string;
  hero_subheadline: string;
  footer_disclaimer: string;
  // Extended branding options
  font_heading: string;
  font_body: string;
  background_image: string;
  background_overlay: boolean;
  social_links: SocialLinks;
  // Landing page images
  hero_image?: string;
  how_it_works_image?: string;
  platforms_image?: string;
  social_proof_image?: string;
}

const defaultBranding: Branding = {
  app_name: 'EngageLoop',
  logo_url: '',
  favicon_url: '',
  primary_color: '#7c3aed',
  secondary_color: '#06b6d4',
  hero_headline: 'Grow Your Online Presence Through Real Human Engagement',
  hero_subheadline: 'Connect with a community of real users. Share your content, engage with others, and earn Capsules to boost your reach—no bots, no automation.',
  footer_disclaimer: 'EngageLoop does not automate actions or access social media accounts. All engagements are performed manually by real users. We are not affiliated with any social media platforms.',
  font_heading: 'Space Grotesk',
  font_body: 'Inter',
  background_image: '',
  background_overlay: true,
  social_links: {},
  hero_image: '',
  how_it_works_image: '',
  platforms_image: '',
  social_proof_image: '',
};

// Available Google Fonts
export const availableFonts = [
  'Space Grotesk',
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Playfair Display',
  'Lora',
  'Raleway',
  'Source Sans Pro',
  'Nunito',
  'DM Sans',
  'Outfit',
  'Plus Jakarta Sans',
];

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'branding')
          .maybeSingle();

        if (error) {
          console.error('Error fetching branding:', error);
          return;
        }

        if (data?.value) {
          const brandingData = data.value as unknown as Branding;
          const merged = { ...defaultBranding, ...brandingData };
          setBranding(merged);
          applyBranding(merged);
        }
      } catch (error) {
        console.error('Error fetching branding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('branding-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.branding',
        },
        (payload) => {
          if (payload.new && 'value' in payload.new) {
            const brandingData = payload.new.value as unknown as Branding;
            const merged = { ...defaultBranding, ...brandingData };
            setBranding(merged);
            applyBranding(merged);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { branding, isLoading };
}

function applyBranding(branding: Branding) {
  // Apply primary color
  if (branding.primary_color) {
    const hsl = hexToHSL(branding.primary_color);
    if (hsl) {
      document.documentElement.style.setProperty('--primary', hsl);
    }
  }

  // Apply secondary color
  if (branding.secondary_color) {
    const hsl = hexToHSL(branding.secondary_color);
    if (hsl) {
      document.documentElement.style.setProperty('--accent', hsl);
    }
  }

  // Apply fonts
  if (branding.font_heading) {
    loadGoogleFont(branding.font_heading);
    document.documentElement.style.setProperty('--font-display', `"${branding.font_heading}", sans-serif`);
  }

  if (branding.font_body) {
    loadGoogleFont(branding.font_body);
    document.documentElement.style.setProperty('--font-sans', `"${branding.font_body}", sans-serif`);
  }

  // Update favicon
  if (branding.favicon_url) {
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = branding.favicon_url;
    }
  }

  // Update document title
  if (branding.app_name) {
    document.title = branding.app_name;
  }
}

function loadGoogleFont(fontName: string) {
  const fontId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Check if already loaded
  if (document.getElementById(fontId)) return;
  
  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
