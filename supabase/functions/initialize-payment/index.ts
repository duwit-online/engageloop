import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InitPaymentRequest {
  provider: "paystack" | "flutterwave";
  amount_ngn: number;
  capsules: number;
  package_id?: string;
  payment_type: "topup" | "subscription";
  subscription_months?: number;
  email: string;
  callback_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body: InitPaymentRequest = await req.json();
    console.log("Initialize payment request:", body);

    // Validate request
    if (!body.provider || !body.amount_ngn || !body.capsules) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get provider config
    const { data: configData, error: configError } = await supabase
      .from("payment_configs")
      .select("*")
      .eq("provider", body.provider)
      .eq("is_enabled", true)
      .single();

    if (configError || !configData) {
      return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const secretKey = configData.config?.secret_key;
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Payment provider secret key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const reference = `PAY_${Date.now()}_${user.id.substring(0, 8)}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/payment-webhook?provider=${body.provider}`;

    // Create pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        provider: body.provider,
        provider_reference: reference,
        amount_ngn: body.amount_ngn,
        capsules: body.capsules,
        package_id: body.package_id,
        payment_type: body.payment_type,
        subscription_months: body.subscription_months,
        status: "pending",
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment:", paymentError);
      return new Response(JSON.stringify({ error: "Failed to create payment" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let paymentUrl: string;
    let paymentReference: string;

    if (body.provider === "paystack") {
      // Initialize Paystack transaction
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email || user.email,
          amount: body.amount_ngn * 100, // Convert to kobo
          reference: reference,
          callback_url: body.callback_url || `${new URL(supabaseUrl).origin}/dashboard/wallet`,
          metadata: {
            user_id: user.id,
            capsules: body.capsules,
            package_id: body.package_id,
            payment_type: body.payment_type,
            subscription_months: body.subscription_months,
          },
        }),
      });

      const paystackData = await paystackResponse.json();
      console.log("Paystack response:", paystackData);

      if (!paystackData.status) {
        throw new Error(paystackData.message || "Paystack initialization failed");
      }

      paymentUrl = paystackData.data.authorization_url;
      paymentReference = paystackData.data.reference;

    } else if (body.provider === "flutterwave") {
      // Initialize Flutterwave payment
      const flwResponse = await fetch("https://api.flutterwave.com/v3/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: body.amount_ngn,
          currency: "NGN",
          redirect_url: body.callback_url || `${new URL(supabaseUrl).origin}/dashboard/wallet`,
          customer: {
            email: body.email || user.email,
          },
          meta: {
            user_id: user.id,
            capsules: body.capsules,
            package_id: body.package_id,
            payment_type: body.payment_type,
            subscription_months: body.subscription_months,
          },
          customizations: {
            title: "Capsule Top-Up",
            description: `Purchase ${body.capsules} Capsules`,
          },
        }),
      });

      const flwData = await flwResponse.json();
      console.log("Flutterwave response:", flwData);

      if (flwData.status !== "success") {
        throw new Error(flwData.message || "Flutterwave initialization failed");
      }

      paymentUrl = flwData.data.link;
      paymentReference = reference;

    } else {
      return new Response(JSON.stringify({ error: "Unsupported provider" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update payment with provider reference
    await supabase
      .from("payments")
      .update({ provider_reference: paymentReference })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: paymentUrl,
        reference: paymentReference,
        payment_id: payment.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error) {
    console.error("Error initializing payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
