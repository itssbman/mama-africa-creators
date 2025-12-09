import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/crypto.ts";
import { encode as encodeHex } from "https://deno.land/std@0.190.0/encoding/hex.ts";

// Helper function to create HMAC SHA512
async function createHmacSha512(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyData = encoder.encode(key);
  const dataBytes = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  const hexBytes = encodeHex(new Uint8Array(signature));
  return decoder.decode(hexBytes);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

interface PaystackEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
    };
    metadata?: {
      user_id?: string;
      product_id?: string;
      transaction_id?: string;
    };
    authorization?: {
      card_type?: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Paystack webhook received");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      console.error("No Paystack signature found in headers");
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature using HMAC SHA512
    const expectedSignature = await createHmacSha512(paystackSecretKey, body);

    if (signature !== expectedSignature) {
      console.error("Invalid Paystack signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Signature verified successfully");

    // Parse the event
    const event: PaystackEvent = JSON.parse(body);
    console.log("Paystack event:", event.event);
    console.log("Event data reference:", event.data.reference);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    if (event.event === "charge.success") {
      console.log("Processing successful charge");
      
      const { reference, amount, currency, channel, status } = event.data;
      const metadata = event.data.metadata || {};
      const cardType = event.data.authorization?.card_type || null;

      // Find the transaction by payment_reference
      const { data: existingTransaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("payment_reference", reference)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching transaction:", fetchError);
        return new Response(
          JSON.stringify({ error: "Database error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (existingTransaction) {
        // Update existing transaction
        console.log("Updating existing transaction:", existingTransaction.id);
        
        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            payment_status: status === "success" ? "completed" : status,
            card_type: cardType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTransaction.id);

        if (updateError) {
          console.error("Error updating transaction:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update transaction" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Create purchase record if payment is successful and product exists
        if (status === "success" && existingTransaction.product_id) {
          console.log("Creating purchase record");
          
          // Check if purchase already exists
          const { data: existingPurchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("transaction_id", existingTransaction.id)
            .maybeSingle();

          if (!existingPurchase) {
            const { error: purchaseError } = await supabase
              .from("purchases")
              .insert({
                user_id: existingTransaction.buyer_id,
                product_id: existingTransaction.product_id,
                transaction_id: existingTransaction.id,
                purchased_at: new Date().toISOString(),
              });

            if (purchaseError) {
              console.error("Error creating purchase:", purchaseError);
              // Don't fail the webhook, just log the error
            } else {
              console.log("Purchase record created successfully");
            }
          } else {
            console.log("Purchase already exists, skipping");
          }
        }

        console.log("Transaction updated successfully");
      } else {
        console.log("No existing transaction found for reference:", reference);
        
        // If we have metadata with transaction_id, try to find and update
        if (metadata.transaction_id) {
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              payment_status: status === "success" ? "completed" : status,
              payment_reference: reference,
              card_type: cardType,
              updated_at: new Date().toISOString(),
            })
            .eq("id", metadata.transaction_id);

          if (updateError) {
            console.error("Error updating transaction by id:", updateError);
          } else {
            console.log("Transaction updated by metadata.transaction_id");
            
            // Create purchase record
            if (status === "success" && metadata.product_id && metadata.user_id) {
              const { error: purchaseError } = await supabase
                .from("purchases")
                .insert({
                  user_id: metadata.user_id,
                  product_id: metadata.product_id,
                  transaction_id: metadata.transaction_id,
                  purchased_at: new Date().toISOString(),
                });

              if (purchaseError) {
                console.error("Error creating purchase:", purchaseError);
              }
            }
          }
        }
      }
    } else if (event.event === "charge.failed") {
      console.log("Processing failed charge");
      
      const { reference } = event.data;

      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference);

      if (updateError) {
        console.error("Error updating failed transaction:", updateError);
      } else {
        console.log("Transaction marked as failed");
      }
    } else {
      console.log("Unhandled event type:", event.event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
