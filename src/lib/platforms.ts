export interface Platform {
  name: string;
  icon: string;
  color: string;
  pattern: RegExp;
}

export const platforms: Platform[] = [
  { name: 'Facebook', icon: 'facebook', color: '#1877F2', pattern: /facebook\.com|fb\.com|fb\.watch/i },
  { name: 'Instagram', icon: 'instagram', color: '#E4405F', pattern: /instagram\.com|instagr\.am/i },
  { name: 'X (Twitter)', icon: 'twitter', color: '#000000', pattern: /twitter\.com|x\.com|t\.co/i },
  { name: 'Threads', icon: 'at-sign', color: '#000000', pattern: /threads\.net/i },
  { name: 'YouTube', icon: 'youtube', color: '#FF0000', pattern: /youtube\.com|youtu\.be/i },
  { name: 'TikTok', icon: 'music', color: '#000000', pattern: /tiktok\.com/i },
  { name: 'LinkedIn', icon: 'linkedin', color: '#0A66C2', pattern: /linkedin\.com/i },
  { name: 'GitHub', icon: 'github', color: '#181717', pattern: /github\.com/i },
  { name: 'Pinterest', icon: 'pin', color: '#E60023', pattern: /pinterest\.com|pin\.it/i },
  { name: 'Spotify', icon: 'music-2', color: '#1DB954', pattern: /spotify\.com|open\.spotify/i },
  { name: 'SoundCloud', icon: 'cloud', color: '#FF5500', pattern: /soundcloud\.com/i },
  { name: 'Twitch', icon: 'twitch', color: '#9146FF', pattern: /twitch\.tv/i },
  { name: 'Discord', icon: 'message-circle', color: '#5865F2', pattern: /discord\.gg|discord\.com/i },
  { name: 'Telegram', icon: 'send', color: '#0088CC', pattern: /t\.me|telegram\.me/i },
  { name: 'WhatsApp', icon: 'phone', color: '#25D366', pattern: /wa\.me|whatsapp\.com/i },
  { name: 'Snapchat', icon: 'ghost', color: '#FFFC00', pattern: /snapchat\.com/i },
  { name: 'Vimeo', icon: 'video', color: '#1AB7EA', pattern: /vimeo\.com/i },
  { name: 'Figma', icon: 'figma', color: '#F24E1E', pattern: /figma\.com/i },
  { name: 'Quora', icon: 'help-circle', color: '#B92B27', pattern: /quora\.com/i },
  { name: 'Audiomack', icon: 'headphones', color: '#FFA200', pattern: /audiomack\.com/i },
  { name: 'Boomplay', icon: 'music-3', color: '#00D4AA', pattern: /boomplay\.com/i },
  { name: 'Tidal', icon: 'waves', color: '#000000', pattern: /tidal\.com/i },
];

export function detectPlatform(url: string): Platform | null {
  for (const platform of platforms) {
    if (platform.pattern.test(url)) {
      return platform;
    }
  }
  return null;
}

export function getPlatformIcon(url: string): string {
  const platform = detectPlatform(url);
  return platform?.icon || 'link';
}

export function getPlatformName(url: string): string {
  const platform = detectPlatform(url);
  return platform?.name || 'Website';
}
