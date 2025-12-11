import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.user;
    console.log("Processing sport path purchase for user:", user.id, user.email);

    // Parse request body
    const { sportCategoryId, currency = "usd" } = await req.json();
    
    if (!sportCategoryId) {
      return new Response(
        JSON.stringify({ error: "Sport category ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to fetch sport category and check existing purchase
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get sport category details
    const { data: sportCategory, error: sportError } = await supabaseAdmin
      .from("sport_categories")
      .select("id, name, key_name, price_usd, price_pln, description")
      .eq("id", sportCategoryId)
      .single();

    if (sportError || !sportCategory) {
      console.error("Sport category error:", sportError);
      return new Response(
        JSON.stringify({ error: "Sport category not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sport category found:", sportCategory.name, "Price USD:", sportCategory.price_usd);

    // Check if user already purchased this sport
    const { data: existingPurchase } = await supabaseAdmin
      .from("user_sport_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("sport_category_id", sportCategoryId)
      .single();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "You already have access to this sport path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get price based on currency
    const priceInCents = currency === "pln" ? sportCategory.price_pln : sportCategory.price_usd;
    const stripeCurrency = currency === "pln" ? "pln" : "usd";

    if (!priceInCents || priceInCents <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid price configuration for this sport" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = newCustomer.id;
    }

    console.log("Creating Stripe checkout session for sport path:", sportCategory.name);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "blik", "p24"],
      line_items: [
        {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: `Ścieżka: ${sportCategory.name}`,
              description: sportCategory.description || `Pełny dostęp do wszystkich poziomów i wyzwań w ścieżce ${sportCategory.name}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&type=sport_path`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled?type=sport_path`,
      metadata: {
        user_id: user.id,
        sport_category_id: sportCategoryId,
        sport_name: sportCategory.name,
        purchase_type: "sport_path",
      },
    });

    console.log("Checkout session created:", session.id);

    // Record the order as pending
    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      order_type: "sport_path",
      item_id: sportCategoryId,
      amount: priceInCents,
      currency: stripeCurrency,
      status: "pending",
      stripe_session_id: session.id,
    });

    if (orderError) {
      console.error("Order creation error:", orderError);
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in purchase-sport-path:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
