import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface CreateUserRequest {
  email: string;
  password: string;
  display_name: string;
  role: "admin" | "user";
  plan: "freemium" | "premium";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get calling user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !callingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: CreateUserRequest = await req.json();
    console.log("Admin creating user:", body.email);

    // Validate request
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create user using admin API (service role)
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        display_name: body.display_name,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const newUserId = authData.user.id;

    // Update profile with plan and display_name
    await supabase
      .from("profiles")
      .update({
        plan: body.plan,
        display_name: body.display_name,
      })
      .eq("id", newUserId);

    // Assign role if admin
    if (body.role === "admin") {
      await supabase.from("user_roles").insert({
        user_id: newUserId,
        role: "admin",
      });
    }

    // Generate password reset link for the new user
    const origin = req.headers.get("origin") || "https://app.example.com";
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: body.email,
      options: {
        redirectTo: `${origin}/dashboard`,
      },
    });

    let accessLink = `${origin}/login`; // Fallback
    
    if (resetData?.properties?.action_link) {
      accessLink = resetData.properties.action_link;
      console.log("Generated password reset link for user");
    } else if (resetError) {
      console.error("Error generating reset link:", resetError);
      // Still succeed but with login link
    }

    console.log("User created successfully:", newUserId);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        access_link: accessLink,
        is_reset_link: !!resetData?.properties?.action_link,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in admin-create-user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
