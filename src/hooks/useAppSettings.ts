import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PremiumPricing {
  monthly: number;
  quarterly_discount: number;
  biannual_discount: number;
  annual_discount: number;
}

export interface CapsulePackage {
  id: string;
  capsules: number;
  price: number;
  label: string;
  featured?: boolean;
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
  hero_image?: string;
  platforms_image?: string;
  social_proof_image?: string;
}

export interface AppSettings {
  premium_pricing: PremiumPricing;
  capsule_packages: CapsulePackage[];
  branding: Branding;
  task_rewards: Record<string, number>;
  economy_settings: {
    daily_limit_free: number;
    monthly_allowance_free: number;
    monthly_allowance_premium: number;
    premium_multiplier: number;
  };
}

const defaultSettings: AppSettings = {
  premium_pricing: {
    monthly: 3000,
    quarterly_discount: 0.1,
    biannual_discount: 0.15,
    annual_discount: 0.25,
  },
  capsule_packages: [
    { id: 'starter', capsules: 100, price: 500, label: 'Starter' },
    { id: 'popular', capsules: 500, price: 2000, label: 'Popular' },
    { id: 'best_value', capsules: 1500, price: 5000, label: 'Best Value', featured: true },
  ],
  branding: {
    app_name: 'EngageLoop',
    logo_url: '',
    favicon_url: '',
    primary_color: '#7c3aed',
    secondary_color: '#06b6d4',
    hero_headline: 'Grow Your Online Presence Through Real Human Engagement',
    hero_subheadline: 'Connect with a community of real users.',
    footer_disclaimer: '',
  },
  task_rewards: {
    like: 5,
    comment: 10,
    follow: 15,
    stream: 15,
  },
  economy_settings: {
    daily_limit_free: 100,
    monthly_allowance_free: 1500,
    monthly_allowance_premium: 6000,
    premium_multiplier: 1.5,
  },
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) {
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          const settingsMap: Record<string, any> = {};
          data.forEach(item => {
            settingsMap[item.key] = item.value;
          });

          setSettings({
            premium_pricing: settingsMap.premium_pricing || defaultSettings.premium_pricing,
            capsule_packages: settingsMap.capsule_packages || defaultSettings.capsule_packages,
            branding: settingsMap.branding || defaultSettings.branding,
            task_rewards: settingsMap.task_rewards || defaultSettings.task_rewards,
            economy_settings: settingsMap.economy_settings || defaultSettings.economy_settings,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('app-settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, isLoading };
}
