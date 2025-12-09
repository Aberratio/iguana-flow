import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Redeeming sport code:", code, "for user:", user.id);

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the code
    const { data: redemptionCode, error: codeError } = await supabaseAdmin
      .from("sport_redemption_codes")
      .select("*, sport_categories(id, name, key_name)")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .single();

    if (codeError || !redemptionCode) {
      console.error("Code not found:", codeError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (redemptionCode.expires_at && new Date(redemptionCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This code has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if max uses reached
    if (redemptionCode.max_uses && redemptionCode.current_uses >= redemptionCode.max_uses) {
      return new Response(
        JSON.stringify({ error: "This code has reached its maximum uses" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has this sport
    const { data: existingPurchase } = await supabaseAdmin
      .from("user_sport_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("sport_category_id", redemptionCode.sport_category_id)
      .single();

    if (existingPurchase) {
      return new Response(
        JSON.stringify({ error: "You already have access to this sport path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the purchase record
    const { error: purchaseError } = await supabaseAdmin
      .from("user_sport_purchases")
      .insert({
        user_id: user.id,
        sport_category_id: redemptionCode.sport_category_id,
        purchase_type: "redemption",
        redemption_code: code.toUpperCase().trim(),
        notes: `Redeemed code: ${code}`,
      });

    if (purchaseError) {
      console.error("Purchase creation error:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to redeem code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment the code usage
    await supabaseAdmin
      .from("sport_redemption_codes")
      .update({ current_uses: redemptionCode.current_uses + 1 })
      .eq("id", redemptionCode.id);

    // Record in orders table
    await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      order_type: "sport_path_redemption",
      item_id: redemptionCode.sport_category_id,
      status: "completed",
    });

    console.log("Sport code redeemed successfully for sport:", redemptionCode.sport_categories?.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sportName: redemptionCode.sport_categories?.name,
        message: `Successfully unlocked ${redemptionCode.sport_categories?.name} path!`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in redeem-sport-code:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
