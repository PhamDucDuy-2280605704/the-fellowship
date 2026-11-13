"use server";

import { randomBytes, randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth/platform";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function setUserSuspension(formData: FormData): Promise<void> {
  const userId = field(formData, "userId");
  const shouldSuspend = field(formData, "shouldSuspend") === "true";
  const reason = field(formData, "reason");

  if (!/^[0-9a-f-]{36}$/i.test(userId) || (shouldSuspend && !reason) || reason.length > 500) {
    redirect("/the-stewards-hall/accounts?error=invalid-input");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("admin_set_user_suspension", {
    p_user_id: userId,
    p_is_suspended: shouldSuspend,
    p_reason: reason || undefined,
  });

  if (error) {
    redirect("/the-stewards-hall/accounts?error=update-failed");
  }

  redirect(shouldSuspend ? "/the-stewards-hall/accounts?notice=suspended" : "/the-stewards-hall/accounts?notice=restored");
}

export async function setWorkspaceArchived(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const shouldArchive = field(formData, "shouldArchive") === "true";

  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    redirect("/the-stewards-hall/workspaces?error=invalid-input");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc("admin_set_workspace_archived", {
    p_workspace_id: workspaceId,
    p_is_archived: shouldArchive,
  });

  if (error) {
    redirect("/the-stewards-hall/workspaces?error=update-failed");
  }

  redirect(shouldArchive ? "/the-stewards-hall/workspaces?notice=archived" : "/the-stewards-hall/workspaces?notice=restored");
}

export async function deleteWorkspacePermanently(formData: FormData): Promise<void> {
  const workspaceId = field(formData, "workspaceId");
  const confirmation = field(formData, "confirmDelete");
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    redirect("/the-stewards-hall/workspaces?error=invalid-input");
  }
  if (confirmation !== "yes") {
    redirect("/the-stewards-hall/workspaces?error=delete-confirm");
  }

  const { supabase } = await requirePlatformAdmin();
  const { error } = await supabase.rpc(
    "delete_workspace" as "leave_workspace",
    { p_workspace_id: workspaceId },
  );

  if (error) {
    console.error("[admin.workspace.delete] Workspace deletion failed", { code: error.code ?? "unknown" });
    redirect("/the-stewards-hall/workspaces?error=delete-failed");
  }

  redirect("/the-stewards-hall/workspaces?notice=deleted");
}

export async function deleteUserAccount(formData: FormData): Promise<void> {
  const userId = field(formData, "userId");
  const confirmEmail = field(formData, "confirmEmail").toLowerCase();

  if (!/^[0-9a-f-]{36}$/i.test(userId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(confirmEmail)) {
    redirect("/the-stewards-hall/accounts?error=delete-invalid");
  }

  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase.functions.invoke("account-recovery", {
    body: { action: "delete-user", userId, confirmEmail },
  });

  let edgeCode = typeof data?.error === "string" ? data.error : "";
  const responseContext = error?.context;
  if (responseContext instanceof Response) {
    const payload = await responseContext.clone().json().catch(() => null) as { error?: string } | null;
    if (typeof payload?.error === "string") edgeCode = payload.error;
  }

  if (error || data?.ok !== true) {
    const errorRoute: Record<string, string> = {
      AUTH_REQUIRED: "delete-failed",
      ADMIN_REQUIRED: "delete-failed",
      ADMIN_ACCOUNT_ACTIVE_REQUIRED: "delete-failed",
      INVALID_USER: "delete-invalid",
      CANNOT_DELETE_SELF: "delete-self",
      ADMIN_ACCOUNT_PROTECTED: "delete-admin",
      EMAIL_CONFIRMATION_MISMATCH: "delete-email",
      USER_OWNS_WORKSPACES: "delete-workspaces",
      DELETE_BLOCKED: "delete-related-data",
    };
    const routeError = errorRoute[edgeCode] ?? "delete-failed";
    console.error("[admin.user.delete] Account deletion rejected", { code: edgeCode || "unknown" });
    redirect(`/the-stewards-hall/accounts?error=${routeError}`);
  }

  revalidatePath("/the-stewards-hall/accounts");
  redirect("/the-stewards-hall/accounts?notice=deleted");
}


export type CredentialResetResult =
  | { ok: true; email: string; password: string; pin: string }
  | { ok: false; message: string };

/** Generate replacement credentials and return them only in this authenticated action response. */
export async function resetUserCredentials(formData: FormData): Promise<CredentialResetResult> {
  const userId = field(formData, "userId");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return { ok: false, message: "Tài khoản không hợp lệ." };
  }

  const { supabase, user: adminUser } = await requirePlatformAdmin();
  const password = `Tf-${randomBytes(18).toString("base64url")}!9`;
  const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");

  const { data, error } = await supabase.functions.invoke("account-recovery", {
    body: { action: "admin-reset-credentials", userId, password, pin },
  });

  let edgeCode = typeof data?.error === "string" ? data.error : "";
  const responseContext = error?.context;
  if (responseContext instanceof Response) {
    const payload = await responseContext.clone().json().catch(() => null) as { error?: string } | null;
    if (typeof payload?.error === "string") edgeCode = payload.error;
  }
  if (error || data?.ok !== true) {
    const messages: Record<string, string> = {
      ADMIN_REQUIRED: "Chỉ Platform Admin mới được phép thực hiện.",
      ADMIN_ACCOUNT_ACTIVE_REQUIRED: "Tài khoản Admin đang bị khóa.",
      INVALID_USER: "Không tìm thấy tài khoản người dùng.",
      ADMIN_ACCOUNT_PROTECTED: "Không thể đặt lại thông tin cho tài khoản Admin.",
      PIN_UPDATE_FAILED: "Không thể cập nhật PIN. Mật khẩu chưa được thay đổi.",
      PASSWORD_UPDATE_FAILED: "PIN đã được cập nhật nhưng mật khẩu chưa đổi. Hãy thử lại.",
    };
    console.error("[admin.user.credentials] Reset rejected", { code: edgeCode || "unknown", adminId: adminUser.id });
    return { ok: false, message: messages[edgeCode] ?? "Không thể đặt lại thông tin đăng nhập." };
  }

  revalidatePath("/the-stewards-hall/accounts");
  return { ok: true, email: String(data.email ?? ""), password, pin };
}
