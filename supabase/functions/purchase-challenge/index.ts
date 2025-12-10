import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated");

    const { challengeId, currency = "usd" } = await req.json();
    
    if (!challengeId) {
      throw new Error("Challenge ID is required");
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabaseClient
      .from("challenges")
      .select("title, premium, price_usd, price_pln")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      throw new Error("Challenge not found");
    }

    if (!challenge.premium) {
      throw new Error("This challenge is not premium");
    }

    // Check if user already purchased this challenge
    const { data: existingPurchase } = await supabaseClient
      .from("user_challenge_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .single();

    if (existingPurchase) {
      throw new Error("You have already purchased this challenge");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Use challenge-specific prices or fallback to defaults
    const prices = {
      usd: challenge.price_usd || 999, // Default $9.99
      pln: challenge.price_pln || 3999, // Default 39.99 PLN
    };

    const amount = prices[currency as keyof typeof prices] || prices.usd;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card", "blik"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Premium Challenge: ${challenge.title}`,
              description: "Unlock premium challenge access",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/challenges?purchase=success`,
      cancel_url: `${req.headers.get("origin")}/challenges?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        challenge_id: challengeId,
        purchase_type: "challenge",
      },
    });

    // Record the order
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("orders").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      amount: amount,
      currency: currency,
      status: "pending",
      order_type: "challenge",
      item_id: challengeId,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating challenge purchase:", error);
    return new Response(JSON.stringify({ error: (error as any).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});