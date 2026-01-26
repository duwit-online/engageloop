import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature, verif-hash",
};

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: {
      user_id?: string;
      capsules?: number;
      package_id?: string;
      payment_type?: string;
      subscription_months?: number;
    };
  };
}

interface FlutterwaveEvent {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    status: string;
    meta?: {
      user_id?: string;
      capsules?: number;
      package_id?: string;
      payment_type?: string;
      subscription_months?: number;
    };
  };
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get("provider");

    if (!provider || !["paystack", "flutterwave"].includes(provider)) {
      console.error("Invalid or missing provider:", provider);
      return new Response(JSON.stringify({ error: "Invalid provider" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    console.log(`[${provider}] Webhook received:`, JSON.stringify(body, null, 2));

    // Get provider config for verification
    const { data: configData } = await supabase
      .from("payment_configs")
      .select("config")
      .eq("provider", provider)
      .single();

    const secretKey = configData?.config?.secret_key;

    if (provider === "paystack") {
      // Verify Paystack signature
      const signature = req.headers.get("x-paystack-signature");
      if (secretKey && signature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(secretKey),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const rawBody = JSON.stringify(body);
        const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
        const computedSignature = Array.from(new Uint8Array(signatureBytes))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
        
        if (computedSignature !== signature) {
          console.error("Invalid Paystack signature");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }

      const event = body as PaystackEvent;
      
      if (event.event === "charge.success" && event.data.status === "success") {
        await processSuccessfulPayment(supabase, {
          provider: "paystack",
          reference: event.data.reference,
          amountNgn: event.data.amount / 100, // Paystack sends amount in kobo
          userId: event.data.metadata?.user_id,
          capsules: event.data.metadata?.capsules,
          packageId: event.data.metadata?.package_id,
          paymentType: event.data.metadata?.payment_type || "topup",
          subscriptionMonths: event.data.metadata?.subscription_months,
        });
      }
    } else if (provider === "flutterwave") {
      // Verify Flutterwave hash
      const verifHash = req.headers.get("verif-hash");
      const secretHash = configData?.config?.secret_hash;
      
      if (secretHash && verifHash !== secretHash) {
        console.error("Invalid Flutterwave hash");
        return new Response(JSON.stringify({ error: "Invalid hash" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const event = body as FlutterwaveEvent;
      
      if (event.event === "charge.completed" && event.data.status === "successful") {
        await processSuccessfulPayment(supabase, {
          provider: "flutterwave",
          reference: event.data.flw_ref || event.data.tx_ref,
          amountNgn: event.data.amount,
          userId: event.data.meta?.user_id,
          capsules: event.data.meta?.capsules,
          packageId: event.data.meta?.package_id,
          paymentType: event.data.meta?.payment_type || "topup",
          subscriptionMonths: event.data.meta?.subscription_months,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

interface PaymentData {
  provider: string;
  reference: string;
  amountNgn: number;
  userId?: string;
  capsules?: number;
  packageId?: string;
  paymentType: string;
  subscriptionMonths?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processSuccessfulPayment(supabase: any, data: PaymentData) {
  console.log("Processing successful payment:", data);

  if (!data.userId || !data.capsules) {
    console.error("Missing user_id or capsules in payment metadata");
    return;
  }

  // Check if payment already processed
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("provider_reference", data.reference)
    .eq("status", "completed")
    .maybeSingle();

  if (existingPayment) {
    console.log("Payment already processed:", data.reference);
    return;
  }

  // Create or update payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .upsert({
      user_id: data.userId,
      provider: data.provider,
      provider_reference: data.reference,
      amount_ngn: data.amountNgn,
      capsules: data.capsules,
      package_id: data.packageId,
      payment_type: data.paymentType,
      subscription_months: data.subscriptionMonths,
      status: "completed",
      completed_at: new Date().toISOString(),
    }, {
      onConflict: "provider_reference",
    })
    .select()
    .single();

  if (paymentError) {
    console.error("Error creating payment record:", paymentError);
    return;
  }

  console.log("Payment record created:", payment.id);

  // Credit capsules
  const { data: newBalance, error: creditError } = await supabase.rpc("credit_capsules", {
    p_user_id: data.userId,
    p_amount: data.capsules,
    p_type: "purchased",
    p_description: `${data.provider} payment - ${data.packageId || "Top-up"}`,
    p_reference_id: payment.id,
    p_reference_type: "payment",
  });

  if (creditError) {
    console.error("Error crediting capsules:", creditError);
    return;
  }

  console.log("Capsules credited. New balance:", newBalance);

  // Handle subscription if applicable
  if (data.paymentType === "subscription" && data.subscriptionMonths) {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + data.subscriptionMonths);

    const { error: subError } = await supabase
      .from("user_subscriptions")
      .upsert({
        user_id: data.userId,
        plan: "premium",
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (subError) {
      console.error("Error updating subscription:", subError);
    } else {
      console.log("Subscription updated, expires:", expiresAt.toISOString());

      // Update profile plan
      await supabase
        .from("profiles")
        .update({ plan: "premium" })
        .eq("id", data.userId);
    }
  }
}
