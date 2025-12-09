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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature!,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    console.log("Received Stripe event:", event.type);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const purchaseType = session.metadata?.purchase_type;

        console.log("Checkout completed - Type:", purchaseType, "User:", userId);

        // Update order status
        await supabaseAdmin
          .from("orders")
          .update({ status: "completed" })
          .eq("stripe_session_id", session.id);

        // Handle sport path purchase
        if (purchaseType === "sport_path" && userId && session.metadata?.sport_category_id) {
          const sportCategoryId = session.metadata.sport_category_id;
          
          const { error } = await supabaseAdmin.from("user_sport_purchases").insert({
            user_id: userId,
            sport_category_id: sportCategoryId,
            purchase_type: "payment",
            payment_amount: session.amount_total,
            currency: session.currency,
            stripe_session_id: session.id,
          });

          if (error) {
            console.error("Error creating sport purchase:", error);
          } else {
            console.log("Sport path purchase recorded for user:", userId, "sport:", sportCategoryId);
          }
        }

        // Handle challenge purchase (legacy support)
        if (purchaseType === "challenge" && userId && session.metadata?.challenge_id) {
          const { error } = await supabaseAdmin.from("user_challenge_purchases").insert({
            user_id: userId,
            challenge_id: session.metadata.challenge_id,
            amount_paid: session.amount_total,
            currency: session.currency,
            stripe_session_id: session.id,
          });

          if (error) console.error("Error creating challenge purchase:", error);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        await supabaseAdmin
          .from("orders")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);
        console.log("Checkout session expired:", session.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
            if (purchaseError) {
              console.error("Error creating purchase record:", purchaseError);
            } else {
              console.log("Challenge purchase recorded successfully");
            }

            // Update the order status
            const { error: orderError } = await supabaseService
              .from("orders")
              .update({ status: "paid" })
              .eq("stripe_session_id", session.id);

            if (orderError) {
              console.error("Error updating order status:", orderError);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order status to expired
        const { error } = await supabaseService
          .from("orders")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Error updating expired order:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: (error as any).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});