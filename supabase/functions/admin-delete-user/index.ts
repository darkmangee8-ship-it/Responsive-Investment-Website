import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};import { createClient } from "npm:@supabase/supabase-js@2";
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

Deno.serve(async (req) => {
  /*
   * Handle browser CORS preflight.
   */
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

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
      }
    );
  }

  try {
    /*
     * Supabase environment variables are automatically
     * available inside an Edge Function.
     */
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Server configuration is incomplete.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Get the logged-in admin's access token.
     */
    const authHeader =
      req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Authorization header is required.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Client that runs as the current user.
     * This lets us identify who is calling the function.
     */
    const userClient =
      createClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          global: {
            headers: {
              Authorization:
                authHeader,
            },
          },
        }
      );

    const {
      data: {
        user: currentUser,
      },
      error: currentUserError,
    } =
      await userClient.auth.getUser();

    if (
      currentUserError ||
      !currentUser
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "You must be logged in.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Verify the caller is an administrator.
     */
    const {
      data: adminProfile,
      error: adminProfileError,
    } =
      await userClient
        .from("profiles")
        .select("id,is_admin")
        .eq(
          "id",
          currentUser.id
        )
        .maybeSingle();

    if (adminProfileError) {
      console.error(
        "ADMIN PROFILE ERROR:",
        adminProfileError
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Unable to verify administrator access.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    if (!adminProfile?.is_admin) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Administrator access required.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Read requested target user.
     */
    let body: {
      user_id?: string;
    };

    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Invalid JSON request body.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    const targetUserId =
      body.user_id?.trim();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "user_id is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Never allow an administrator to delete
     * their own account through this function.
     */
    if (
      targetUserId ===
      currentUser.id
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "You cannot permanently delete your own administrator account.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Service-role client.
     *
     * IMPORTANT:
     * This key exists only inside the Edge Function.
     */
    const adminClient =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    /*
     * Confirm that the target profile exists
     * and isn't another administrator.
     */
    const {
      data: targetProfile,
      error: targetProfileError,
    } =
      await adminClient
        .from("profiles")
        .select(
          "id,first_name,last_name,email,is_admin"
        )
        .eq(
          "id",
          targetUserId
        )
        .maybeSingle();

    if (targetProfileError) {
      console.error(
        "TARGET PROFILE ERROR:",
        targetProfileError
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Unable to find the requested user.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    if (!targetProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "User profile not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    if (targetProfile.is_admin) {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "Administrator accounts cannot be permanently deleted from this action.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * Get the user's name for the response.
     */
    const targetName =
      `${targetProfile.first_name ?? ""} ${targetProfile.last_name ?? ""}`
        .trim() ||
      targetProfile.email ||
      "User";

    /*
     * Delete the Auth account.
     *
     * If your database foreign keys use
     * ON DELETE CASCADE, related profile/data records
     * will be removed automatically where configured.
     */
    const {
      error: deleteAuthError,
    } =
      await adminClient.auth.admin.deleteUser(
        targetUserId
      );

    if (deleteAuthError) {
      console.error(
        "AUTH DELETE ERROR:",
        deleteAuthError
      );

      return new Response(
        JSON.stringify({
          success: false,
          message:
            deleteAuthError.message ||
            "Unable to permanently delete the user account.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    /*
     * If profile still exists because a foreign key
     * isn't configured with ON DELETE CASCADE,
     * explicitly remove it.
     */
    const {
      error: profileDeleteError,
    } =
      await adminClient
        .from("profiles")
        .delete()
        .eq(
          "id",
          targetUserId
        );

    if (profileDeleteError) {
      /*
       * The Auth user has already been deleted.
       * Log the problem rather than pretending the
       * whole operation didn't happen.
       */
      console.error(
        "PROFILE CLEANUP ERROR:",
        profileDeleteError
      );
    }

    /*
     * Optional audit record.
     *
     * This only works if your audit_logs table accepts
     * the fields used below.
     *
     * We intentionally don't fail the deletion if the
     * audit insert fails.
     */
    try {
      await adminClient
        .from("audit_logs")
        .insert({
          action:
            "DELETE_USER",
          admin_id:
            currentUser.id,
          target_user_id:
            targetUserId,
          target_user_name:
            targetName,
          amount: null,
          details: {
            email:
              targetProfile.email,
            permanent:
              true,
          },
        });
    } catch (auditError) {
      console.error(
        "AUDIT ERROR:",
        auditError
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          `${targetName} was permanently deleted.`,
        user_id:
          targetUserId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "EDGE FUNCTION ERROR:",
      error
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
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});