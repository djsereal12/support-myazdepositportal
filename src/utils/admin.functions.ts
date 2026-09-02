import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  properties: number;
  reports: number;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authError) throw new Error(authError.message);

    const ids = authList.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }, { data: properties }, { data: reports }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids),
        supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
        supabaseAdmin.from("properties").select("user_id").in("user_id", ids),
        supabaseAdmin.from("reports").select("user_id").in("user_id", ids),
      ]);

    const count = (rows: { user_id: string }[] | null, id: string) =>
      (rows ?? []).filter((r) => r.user_id === id).length;

    return authList.users.map((u) => {
      const p = (profiles ?? []).find((row) => row.id === u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p?.full_name ?? null,
        phone: p?.phone ?? null,
        roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
        created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed: Boolean(u.email_confirmed_at),
        properties: count(properties as { user_id: string }[] | null, u.id),
        reports: count(reports as { user_id: string }[] | null, u.id),
      };
    });
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => {
    if (!data?.userId || typeof data.userId !== "string") throw new Error("userId required");
    return data;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_admin", { _user_id: context.userId });
    return { admin: Boolean(data) };
  });
