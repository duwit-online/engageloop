import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Music,
  Music2,
  Music3,
  Cloud,
  Twitch,
  MessageCircle,
  Send,
  Phone,
  Ghost,
  Video,
  Figma,
  HelpCircle,
  Headphones,
  Waves,
  Link,
  AtSign,
  Pin,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  music: Music,
  'music-2': Music2,
  'music-3': Music3,
  cloud: Cloud,
  twitch: Twitch,
  'message-circle': MessageCircle,
  send: Send,
  phone: Phone,
  ghost: Ghost,
  video: Video,
  figma: Figma,
  'help-circle': HelpCircle,
  headphones: Headphones,
  waves: Waves,
  link: Link,
  'at-sign': AtSign,
  pin: Pin,
};

interface PlatformIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export function PlatformIcon({ icon, className, size = 20 }: PlatformIconProps) {
  const IconComponent = iconMap[icon] || Link;
  
  return (
    <IconComponent
      className={cn('text-foreground', className)}
      size={size}
    />
  );
}
