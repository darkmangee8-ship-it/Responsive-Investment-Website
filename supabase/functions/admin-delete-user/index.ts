import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";


Deno.serve(async (req) => {
  // ---------------------------------------------------------
  // CORS PREFLIGHT
  // ---------------------------------------------------------
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // ---------------------------------------------------------
  // ONLY POST IS ALLOWED
  // ---------------------------------------------------------
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Only POST requests are allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // -------------------------------------------------------
    // ENVIRONMENT
    // -------------------------------------------------------

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Missing Supabase Edge Function environment variables.",
      );

      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration is incomplete.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // AUTHORIZATION HEADER
    // -------------------------------------------------------

    const authorization =
      req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Authorization required.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // CLIENT USING THE CURRENT USER SESSION
    // -------------------------------------------------------

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user: adminUser },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !adminUser) {
      console.error(
        "AUTH ERROR:",
        authError,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or expired session.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // VERIFY ADMIN
    // -------------------------------------------------------

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await userClient
      .from("profiles")
      .select("id, is_admin")
      .eq("id", adminUser.id)
      .maybeSingle();

    if (adminProfileError) {
      console.error(
        "ADMIN PROFILE ERROR:",
        adminProfileError,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Unable to verify administrator permissions.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!adminProfile?.is_admin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Administrator access required.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // REQUEST BODY
    // -------------------------------------------------------

    let body: { user_id?: string };

    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid JSON request body.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const targetUserId =
      body.user_id?.trim();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "user_id is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // PREVENT SELF-DELETION
    // -------------------------------------------------------

    if (
      targetUserId === adminUser.id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "You cannot delete your own administrator account.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // SERVICE ROLE CLIENT
    // -------------------------------------------------------

    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // -------------------------------------------------------
    // FIND TARGET USER
    // -------------------------------------------------------

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, first_name, last_name, email, is_admin",
      )
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetProfileError) {
      console.error(
        "TARGET PROFILE ERROR:",
        targetProfileError,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Unable to find the selected user.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!targetProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User profile not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Never delete another administrator.
    if (targetProfile.is_admin) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Administrator accounts cannot be deleted from this action.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const targetName =
      `${targetProfile.first_name ?? ""} ${targetProfile.last_name ?? ""}`
        .trim() ||
      targetProfile.email ||
      "User";

    // -------------------------------------------------------
    // DELETE AUTH USER
    // -------------------------------------------------------

    const {
      error: deleteAuthError,
    } = await adminClient.auth.admin.deleteUser(
      targetUserId,
    );

    if (deleteAuthError) {
      console.error(
        "AUTH DELETE ERROR:",
        deleteAuthError,
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            deleteAuthError.message ||
            "Unable to permanently delete the account.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    // -------------------------------------------------------
    // CLEANUP PROFILE
    // -------------------------------------------------------

    const {
      error: profileDeleteError,
    } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (profileDeleteError) {
      console.error(
        "PROFILE CLEANUP ERROR:",
        profileDeleteError,
      );
    }

    // -------------------------------------------------------
    // AUDIT LOG
    // -------------------------------------------------------

    try {
      await adminClient
        .from("audit_logs")
        .insert({
          action: "DELETE_USER",
          admin_id: adminUser.id,
          target_user_id: targetUserId,
          target_user_name: targetName,
          amount: null,
          details: {
            email: targetProfile.email,
            permanent: true,
          },
        });
    } catch (auditError) {
      console.error(
        "AUDIT LOG ERROR:",
        auditError,
      );
    }

    // -------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------

    return new Response(
      JSON.stringify({
        success: true,
        message:
          `${targetName} was permanently deleted.`,
        user_id: targetUserId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "EDGE FUNCTION ERROR:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});

