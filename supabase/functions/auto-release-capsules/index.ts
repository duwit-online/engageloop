import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Auto-release capsules job started');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all verified submissions that are past their pending period
    // Trusted: 10min, Normal: 30min, Restricted: 2h
    const now = new Date();
    
    // Fetch verified submissions
    const { data: submissions, error: fetchError } = await supabase
      .from('task_submissions')
      .select('*, user_trust_scores!task_submissions_user_id_fkey(trust_score)')
      .eq('status', 'verified');

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
      throw fetchError;
    }

    if (!submissions || submissions.length === 0) {
      console.log('No verified submissions to release');
      return new Response(
        JSON.stringify({ message: 'No submissions to release', released: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${submissions.length} verified submissions`);

    let releasedCount = 0;
    const releasePromises = [];

    for (const submission of submissions) {
      const verifiedAt = new Date(submission.verified_at);
      const trustScore = submission.user_trust_scores?.trust_score ?? 50;
      
      // Calculate pending duration based on trust score
      let pendingMinutes: number;
      if (trustScore >= 80) {
        pendingMinutes = 10; // Trusted: 10 minutes
      } else if (trustScore >= 50) {
        pendingMinutes = 30; // Normal: 30 minutes
      } else if (trustScore >= 20) {
        pendingMinutes = 120; // Restricted: 2 hours
      } else {
        pendingMinutes = 240; // Suspended: 4 hours (but they shouldn't have verified tasks)
      }

      const releaseTime = new Date(verifiedAt.getTime() + pendingMinutes * 60 * 1000);
      
      if (now >= releaseTime) {
        console.log(`Releasing submission ${submission.id}, verified at ${verifiedAt}, trust score ${trustScore}`);
        
        releasePromises.push(
          supabase
            .from('task_submissions')
            .update({
              status: 'released',
              released_at: now.toISOString(),
            })
            .eq('id', submission.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Error releasing submission ${submission.id}:`, error);
                return false;
              }
              return true;
            })
        );
        
        // Update user's capsule earnings if user_id exists
        if (submission.user_id) {
          releasePromises.push(
            supabase
              .from('user_trust_scores')
              .update({
                total_capsules_earned: supabase.rpc('increment_capsules', {
                  user_id_param: submission.user_id,
                  amount: submission.capsules_earned,
                }),
                total_tasks_completed: supabase.rpc('increment_tasks', {
                  user_id_param: submission.user_id,
                }),
                trust_score: Math.min(100, trustScore + 1), // Increase trust by 1
                last_task_at: now.toISOString(),
              })
              .eq('user_id', submission.user_id)
              .then(({ error }) => {
                if (error) {
                  console.error(`Error updating user stats for ${submission.user_id}:`, error);
                }
              })
          );
        }
        
        releasedCount++;
      }
    }

    await Promise.all(releasePromises);

    console.log(`Released ${releasedCount} submissions`);

    return new Response(
      JSON.stringify({ 
        message: `Released ${releasedCount} submissions`,
        released: releasedCount,
        total_verified: submissions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auto-release error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Auto-release failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
