import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  productId: string;
  productTitle: string;
  productDescription: string;
  flagReason: string;
  flaggedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { productId, productTitle, productDescription, flagReason, flaggedBy }: NotificationRequest = await req.json();

    console.log("Fetching admin users...");
    
    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get admin user emails from auth.users
    const adminUserIds = adminRoles.map(role => role.user_id);
    const { data: adminUsers, error: usersError } = await supabaseClient.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching admin users:", usersError);
      throw usersError;
    }

    const adminEmails = adminUsers.users
      .filter(user => adminUserIds.includes(user.id))
      .map(user => user.email)
      .filter(email => email !== undefined);

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ message: "No admin emails to send to" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending notifications to ${adminEmails.length} admins`);

    // Send email to all admins
    const emailPromises = adminEmails.map(async (email) => {
      const emailResponse = await resend.emails.send({
        from: "HYBRRID <onboarding@resend.dev>",
        to: [email],
        subject: `Product Flagged for Review: ${productTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1E40AF;">Product Flagged for Review</h1>
            <p>A product has been flagged and requires your attention.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #374151;">${productTitle}</h2>
              <p style="color: #6b7280;">${productDescription}</p>
              
              <div style="margin-top: 15px;">
                <strong style="color: #dc2626;">Flag Reason:</strong>
                <p style="margin: 5px 0; color: #374151;">${flagReason}</p>
              </div>
              
              <div style="margin-top: 15px;">
                <strong>Flagged By:</strong>
                <p style="margin: 5px 0; color: #374151;">${flaggedBy}</p>
              </div>
            </div>
            
            <p>Please review this product in the moderation queue and take appropriate action.</p>
            
            <div style="margin-top: 30px;">
              <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace('.supabase.co', '') || ''}/admin" 
                 style="background-color: #1E40AF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Admin Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">
              This is an automated notification from HYBRRID.
            </p>
          </div>
        `,
      });

      return emailResponse;
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    console.log(`Email notifications sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent",
        successful,
        failed,
        totalAdmins: adminEmails.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-admins-flagged-product function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
