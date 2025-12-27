import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError?.message, hasUser: !!userData.user });
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { paymentType, challengeId, currency = 'usd' } = await req.json();
    logStep("Payment request", { paymentType, challengeId, currency });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    logStep("Checking for existing customer", { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer found, will create during checkout");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Currency and amount mapping
    const currencyAmounts: Record<string, number> = {
      'usd': 1000, // $10.00
      'pln': 4000  // 40.00 PLN
    };
    
    const amount = currencyAmounts[currency] || 1000;
    logStep("Currency and amount", { currency, amount });
    
    let session;

    if (paymentType === "subscription") {
      // Create subscription checkout with 7-day free trial
      const sessionConfig: any = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: { name: "Premium Subscription" },
              unit_amount: amount,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        subscription_data: {
          trial_period_days: 7,
        },
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-cancelled`,
      };

      // Use automatic payment methods - Stripe will automatically offer available payment options
      sessionConfig.automatic_payment_methods = { enabled: true };

      logStep("Creating subscription session", { currency, amount });
      try {
        session = await stripe.checkout.sessions.create(sessionConfig);
        logStep("Subscription session created successfully", { sessionId: session.id });
      } catch (stripeError) {
        logStep("Failed to create subscription session", { error: (stripeError as any).message, code: (stripeError as any).code });
        throw stripeError;
      }

      // Create Supabase service client for order recording
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Record order
      await supabaseService.from("orders").insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amount,
        currency: currency,
        order_type: "subscription",
        status: "pending",
      });

    } else if (paymentType === "challenge") {
      // Create one-time payment for premium challenge
      const sessionConfig: any = {
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: { name: "Premium Challenge Access" },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-cancelled`,
      };

      // Use automatic payment methods - Stripe will automatically offer available payment options
      sessionConfig.automatic_payment_methods = { enabled: true };

      logStep("Creating challenge payment session", { currency, amount });
      try {
        session = await stripe.checkout.sessions.create(sessionConfig);
        logStep("Challenge payment session created successfully", { sessionId: session.id });
      } catch (stripeError) {
        logStep("Failed to create challenge payment session", { error: (stripeError as any).message, code: (stripeError as any).code });
        throw stripeError;
      }

      // Create Supabase service client for order recording
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Record order
      await supabaseService.from("orders").insert({
        user_id: user.id,
        stripe_session_id: session.id,
        amount: amount,
        currency: currency,
        order_type: "challenge",
        item_id: challengeId,
        status: "pending",
      });
    } else {
      throw new Error("Invalid payment type");
    }

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    
    // Check if it's a Stripe-specific error
    if (error && typeof error === 'object' && 'type' in error) {
      logStep("Stripe error details", { type: error.type, code: (error as any).code, decline_code: (error as any).decline_code });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});