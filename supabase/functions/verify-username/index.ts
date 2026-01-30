import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to application domains only
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'https://lovable.dev',
  'https://preview--vhairhphwwrlflmkfayc.lovable.app',
  'https://vhairhphwwrlflmkfayc.lovable.app',
];

// Rate limiting map (in-memory, resets on function restart)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimits.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is in allowed list
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface VerificationRequest {
  platform: string;
  username: string;
}

interface VerificationResult {
  isValid: boolean;
  profileData: {
    username: string;
    displayName?: string;
    profileUrl: string;
    avatarUrl?: string;
    followers?: number;
    isVerified?: boolean;
    bio?: string;
  } | null;
  error?: string;
}

// Platform-specific verification functions
async function verifyInstagram(username: string): Promise<VerificationResult> {
  try {
    // Try multiple approaches for Instagram
    const urls = [
      `https://www.instagram.com/${username}/`,
      `https://www.instagram.com/${username}/?__a=1`,
    ];
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        
        if (response.ok) {
          return {
            isValid: true,
            profileData: {
              username: username,
              profileUrl: `https://www.instagram.com/${username}/`,
            },
          };
        }
      } catch (e) {
        console.error(`Failed to check ${url}:`, e);
        continue;
      }
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Instagram verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyTwitter(username: string): Promise<VerificationResult> {
  try {
    // Use API endpoint instead of HEAD request
    const response = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('TWITTER_BEARER_TOKEN') || ''}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://twitter.com/${username}`,
        },
      };
    }
    
    // Fallback: Check simple web request
    const webResponse = await fetch(`https://twitter.com/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }).catch(() => null);
    
    if (webResponse?.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://twitter.com/${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Twitter verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyYouTube(username: string): Promise<VerificationResult> {
  try {
    // Try both @handle and channel formats
    const urls = [
      `https://www.youtube.com/@${username}`,
      `https://www.youtube.com/c/${username}`,
      `https://www.youtube.com/user/${username}`,
    ];
    
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (response.ok || response.status === 200) {
          return {
            isValid: true,
            profileData: {
              username: username,
              profileUrl: url,
            },
          };
        }
      } catch (e) {
        console.error(`Failed to check ${url}:`, e);
        continue;
      }
    }
    
    return { isValid: false, profileData: null, error: 'Channel not found' };
  } catch (error) {
    console.error('YouTube verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyFacebook(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://www.facebook.com/${username}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://www.facebook.com/${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Facebook verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyTikTok(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://www.tiktok.com/@${username}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://www.tiktok.com/@${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('TikTok verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyLinkedIn(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://www.linkedin.com/in/${username}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://www.linkedin.com/in/${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('LinkedIn verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyPinterest(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://www.pinterest.com/${username}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://www.pinterest.com/${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Pinterest verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifyReddit(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://www.reddit.com/user/${username}/about.json`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        return {
          isValid: true,
          profileData: {
            username: data.data.name,
            profileUrl: `https://www.reddit.com/user/${username}`,
            avatarUrl: data.data.icon_img?.split('?')[0],
          },
        };
      }
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Reddit verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

async function verifySpotify(username: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://open.spotify.com/user/${username}`, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      return {
        isValid: true,
        profileData: {
          username: username,
          profileUrl: `https://open.spotify.com/user/${username}`,
        },
      };
    }
    
    return { isValid: false, profileData: null, error: 'Profile not found' };
  } catch (error) {
    console.error('Spotify verification error:', error);
    return { isValid: false, profileData: null, error: 'Verification failed' };
  }
}

// Generic verification for unsupported platforms
function genericVerification(platform: string, username: string): VerificationResult {
  return {
    isValid: true,
    profileData: {
      username: username,
      profileUrl: `https://${platform.toLowerCase()}.com/${username}`,
    },
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { platform, username }: VerificationRequest = await req.json();
    
    console.log(`Verifying username: ${username} on platform: ${platform}`);
    
    if (!platform || !username) {
      return new Response(
        JSON.stringify({ error: 'Platform and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input length to prevent abuse
    if (username.length > 100 || platform.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid input length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (valid for 24 hours)
    const { data: cached } = await supabase
      .from('username_verifications')
      .select('*')
      .eq('platform', platform.toLowerCase())
      .eq('username', cleanUsername)
      .single();

    const cacheAge = cached ? 
      (Date.now() - new Date(cached.last_verified_at).getTime()) / 1000 / 60 / 60 : 
      Infinity;

    // Use cache if less than 24 hours old
    if (cached && cacheAge < 24) {
      console.log('Using cached verification result');
      return new Response(
        JSON.stringify({
          isValid: cached.is_valid,
          profileData: cached.profile_data,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform verification based on platform
    let result: VerificationResult;
    const platformLower = platform.toLowerCase();

    switch (platformLower) {
      case 'instagram':
        result = await verifyInstagram(cleanUsername);
        break;
      case 'twitter':
      case 'x':
        result = await verifyTwitter(cleanUsername);
        break;
      case 'youtube':
        result = await verifyYouTube(cleanUsername);
        break;
      case 'facebook':
        result = await verifyFacebook(cleanUsername);
        break;
      case 'tiktok':
        result = await verifyTikTok(cleanUsername);
        break;
      case 'linkedin':
        result = await verifyLinkedIn(cleanUsername);
        break;
      case 'pinterest':
        result = await verifyPinterest(cleanUsername);
        break;
      case 'reddit':
        result = await verifyReddit(cleanUsername);
        break;
      case 'spotify':
        result = await verifySpotify(cleanUsername);
        break;
      default:
        // For unsupported platforms, do a generic check
        result = genericVerification(platform, cleanUsername);
    }

    // Cache the result
    if (cached) {
      await supabase
        .from('username_verifications')
        .update({
          is_valid: result.isValid,
          profile_data: result.profileData,
          last_verified_at: new Date().toISOString(),
        })
        .eq('platform', platformLower)
        .eq('username', cleanUsername);
    } else {
      await supabase
        .from('username_verifications')
        .insert({
          platform: platformLower,
          username: cleanUsername,
          is_valid: result.isValid,
          profile_data: result.profileData,
        });
    }

    console.log(`Verification result for ${username} on ${platform}:`, result.isValid);

    return new Response(
      JSON.stringify({
        ...result,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Verification failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
