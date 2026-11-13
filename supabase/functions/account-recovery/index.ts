import { createClient } from "https://esm.sh/@supabase/supabase-js@2.119.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  ?? (() => {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (!raw) return undefined;
    try { return (JSON.parse(raw) as Record<string, string>).default; } catch { return undefined; }
  })();
const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")
  ?? (() => {
    const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    if (!raw) return undefined;
    try { return (JSON.parse(raw) as Record<string, string>).default; } catch { return undefined; }
  })();

if (!supabaseUrl || !serviceKey || !publishableKey) {
  throw new Error("Missing Supabase account recovery environment");
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

function requestIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function readString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const userClient = createClient(supabaseUrl!, publishableKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, userClient };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = readString(body.action, 32);

    if (action === "register") {
      const email = readString(body.email, 254).toLowerCase();
      const password = typeof body.password === "string" ? body.password : "";
      const displayName = readString(body.displayName, 80);
      const pin = readString(body.pin, 6);
      if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
        return json({ error: "INVALID_EMAIL" }, 400);
      }
      if (password.length < 6 || password.length > 128) {
        return json({ error: "INVALID_PASSWORD" }, 400);
      }
      if (displayName.length < 2 || displayName.length > 80) {
        return json({ error: "INVALID_DISPLAY_NAME" }, 400);
      }
      if (!/^\d{6}$/.test(pin)) {
        return json({ error: "INVALID_PIN" }, 400);
      }

      const { data: allowed, error: rateError } = await admin.rpc("allow_account_signup", {
        p_ip: requestIp(request),
      });
      if (rateError) {
        console.error("[account-recovery] Signup rate check failed:", rateError.code ?? "unknown");
        return json({ error: "RATE_CHECK_UNAVAILABLE" }, 503);
      }
      if (allowed !== true) {
        return json({ error: "SIGNUP_RATE_LIMITED" }, 429);
      }

      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          full_name: displayName,
          recovery_pin: pin,
        },
      });
      if (createError) {
        const code = createError.code ?? "unknown";
        console.error("[account-recovery] Member creation failed:", {
          status: createError.status ?? null,
          code,
        });

        if (code === "email_exists" || code === "user_already_exists") {
          return json({ error: "EMAIL_ALREADY_REGISTERED" }, 409);
        }
        if (code === "email_address_invalid") {
          return json({ error: "INVALID_EMAIL" }, 400);
        }
        if (code === "weak_password") {
          return json({ error: "PASSWORD_POLICY_REJECTED" }, 400);
        }
        if (code === "signup_disabled" || code === "email_provider_disabled") {
          return json({ error: "SIGNUP_DISABLED" }, 403);
        }
        if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
          return json({ error: "AUTH_RATE_LIMITED" }, 429);
        }
        return json({ error: "ACCOUNT_CREATION_FAILED" }, 500);
      }
      return json({ ok: true });
    }

    if (action === "status" || action === "set-pin") {
      const session = await authenticatedUser(request);
      if (!session) return json({ error: "AUTH_REQUIRED" }, 401);

      if (action === "status") {
        const { data, error } = await session.userClient.rpc("has_own_account_recovery_pin");
        if (error) {
          console.error("[account-recovery] PIN status check failed:", error.message);
          return json({ error: "STATUS_UNAVAILABLE" }, 503);
        }
        return json({ hasPin: data === true });
      }

      const pin = readString(body.pin, 6);
      if (!/^\d{6}$/.test(pin)) return json({ error: "INVALID_PIN" }, 400);
      const { error } = await session.userClient.rpc("set_own_account_recovery_pin", { p_pin: pin });
      if (error) {
        console.error("[account-recovery] PIN update failed:", error.message);
        return json({ error: "PIN_UPDATE_FAILED" }, 400);
      }
      return json({ ok: true });
    }

    if (action === "admin-reset-credentials") {
      const session = await authenticatedUser(request);
      if (!session) return json({ error: "AUTH_REQUIRED" }, 401);
      const [adminCheck, activeCheck] = await Promise.all([
        session.userClient.rpc("is_platform_admin"),
        session.userClient.rpc("is_platform_user_active"),
      ]);
      if (adminCheck.error || adminCheck.data !== true) return json({ error: "ADMIN_REQUIRED" }, 403);
      if (activeCheck.error || activeCheck.data !== true) return json({ error: "ADMIN_ACCOUNT_ACTIVE_REQUIRED" }, 403);

      const userId = readString(body.userId, 36);
      const password = typeof body.password === "string" ? body.password : "";
      const pin = readString(body.pin, 6);
      if (!/^[0-9a-f-]{36}$/i.test(userId) || password.length < 16 || password.length > 128 || !/^\d{6}$/.test(pin)) {
        return json({ error: "INVALID_USER" }, 400);
      }
      if (userId === session.user.id) return json({ error: "ADMIN_ACCOUNT_PROTECTED" }, 403);

      const { data: users, error: usersError } = await session.userClient.rpc("admin_list_users");
      if (usersError || !users) return json({ error: "USER_LOOKUP_UNAVAILABLE" }, 503);
      const target = users.find((item) => item.user_id === userId);
      if (!target) return json({ error: "INVALID_USER" }, 404);
      if (target.platform_role === "admin") return json({ error: "ADMIN_ACCOUNT_PROTECTED" }, 403);

      const { error: pinError } = await admin.rpc("admin_set_account_recovery_pin", {
        p_admin_user_id: session.user.id,
        p_target_user_id: userId,
        p_pin: pin,
      });
      if (pinError) {
        console.error("[account-recovery] Admin PIN reset failed", { code: pinError.code ?? "unknown" });
        return json({ error: "PIN_UPDATE_FAILED" }, 400);
      }
      const { error: passwordError } = await admin.auth.admin.updateUserById(userId, { password });
      if (passwordError) {
        console.error("[account-recovery] Admin password reset failed", { code: passwordError.code ?? "unknown" });
        return json({ error: "PASSWORD_UPDATE_FAILED" }, 400);
      }
      return json({ ok: true, email: target.email ?? "" });
    }

    if (action === "delete-user") {
      const session = await authenticatedUser(request);
      if (!session) return json({ error: "AUTH_REQUIRED" }, 401);

      // This operation is privileged. Re-check both platform role and account status
      // inside the Edge Function; never trust a role supplied by the browser.
      const [adminCheck, activeCheck] = await Promise.all([
        session.userClient.rpc("is_platform_admin"),
        session.userClient.rpc("is_platform_user_active"),
      ]);
      if (adminCheck.error || adminCheck.data !== true) {
        return json({ error: "ADMIN_REQUIRED" }, 403);
      }
      if (activeCheck.error || activeCheck.data !== true) {
        return json({ error: "ADMIN_ACCOUNT_ACTIVE_REQUIRED" }, 403);
      }

      const userId = readString(body.userId, 36);
      const confirmEmail = readString(body.confirmEmail, 254).toLowerCase();
      if (!/^[0-9a-f-]{36}$/i.test(userId) || !confirmEmail) {
        return json({ error: "INVALID_USER" }, 400);
      }
      if (userId === session.user.id) {
        return json({ error: "CANNOT_DELETE_SELF" }, 403);
      }

      // These authenticated admin RPCs are the source of truth for account role,
      // email and workspace ownership; the browser cannot override these checks.
      const { data: users, error: usersError } = await session.userClient.rpc("admin_list_users");
      if (usersError || !users) {
        console.error("[account-recovery] Admin account lookup failed:", usersError?.code ?? "unknown");
        return json({ error: "USER_LOOKUP_UNAVAILABLE" }, 503);
      }
      const target = users.find((item) => item.user_id === userId);
      if (!target) return json({ error: "INVALID_USER" }, 404);
      if (target.platform_role === "admin") {
        return json({ error: "ADMIN_ACCOUNT_PROTECTED" }, 403);
      }
      if (!target.email || target.email.toLowerCase() !== confirmEmail) {
        return json({ error: "EMAIL_CONFIRMATION_MISMATCH" }, 400);
      }

      const { data: workspaces, error: workspacesError } = await session.userClient.rpc("admin_list_workspaces");
      if (workspacesError || !workspaces) {
        console.error("[account-recovery] Workspace ownership check failed:", workspacesError?.code ?? "unknown");
        return json({ error: "WORKSPACE_CHECK_UNAVAILABLE" }, 503);
      }
      if (workspaces.some((workspace) => workspace.created_by === userId)) {
        return json({ error: "USER_OWNS_WORKSPACES" }, 409);
      }

      // Auth Admin API requires the service key. It is used only on this server-side
      // function and is never returned to, or embedded in, the application bundle.
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId, false);
      if (deleteError) {
        console.error("[account-recovery] Admin deletion failed:", {
          code: deleteError.code ?? "unknown",
          status: deleteError.status ?? null,
        });
        // Several application tables intentionally retain authored records with
        // ON DELETE RESTRICT, and Storage objects can also prevent Auth deletion.
        return json({ error: "DELETE_BLOCKED" }, 409);
      }

      return json({ ok: true });
    }

    if (action !== "reset-password") return json({ error: "INVALID_ACTION" }, 400);

    const email = readString(body.email, 254).toLowerCase();
    const pin = readString(body.pin, 6);
    const password = typeof body.password === "string" ? body.password : "";
    const minimumPasswordLength = 6;

    if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(pin)
      || password.length < minimumPasswordLength || password.length > 128) {
      return json({ error: "RECOVERY_FAILED" }, 400);
    }

    const { data: userId, error: verifyError } = await admin.rpc("verify_account_recovery_pin", {
      p_email: email,
      p_pin: pin,
      p_ip: requestIp(request),
    });

    if (verifyError) {
      console.error("[account-recovery] PIN verification failed:", verifyError.message);
      return json({ error: "RECOVERY_FAILED" }, 400);
    }
    if (typeof userId !== "string") return json({ error: "RECOVERY_FAILED" }, 400);

    const { data: userData, error: lookupError } = await admin.auth.admin.getUserById(userId);
    const user = userData.user;
    if (lookupError || !user || user.email?.toLowerCase() !== email) {
      console.error("[account-recovery] Account lookup failed after PIN verification");
      return json({ error: "RECOVERY_FAILED" }, 400);
    }
    if (user.banned_until && new Date(user.banned_until).getTime() > Date.now()) {
      return json({ error: "RECOVERY_FAILED" }, 400);
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password });
    if (updateError) {
      console.error("[account-recovery] Password update failed:", updateError.message);
      return json({ error: "RECOVERY_FAILED" }, 400);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("[account-recovery] Request failed:", error instanceof Error ? error.message : error);
    return json({ error: "RECOVERY_FAILED" }, 400);
  }
});
