import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

type Input = { user_id: string };

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const i = input as Input;
    if (!i || typeof i.user_id !== "string" || !i.user_id) throw new Error("user_id required");
    return i;
  })
  .handler(async ({ data }): Promise<{ success?: boolean; error?: string }> => {
    const authed = await getAuthedUser();
    if (!authed) return { error: "Unauthorized" };
    const callerId = authed.user.id;

    const admin = adminClient();

    const { data: rolesData } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (rolesData ?? []).some((r: { role: string }) => r.role === "admin");
    if (!isAdmin) return { error: "Forbidden" };

    if (data.user_id === callerId) return { error: "Cannot delete yourself" };

    // Cleanup related rows (best-effort)
    await admin.from("user_roles").delete().eq("user_id", data.user_id);
    await admin.from("profiles").delete().eq("id", data.user_id);

    const { error: delErr } = await admin.auth.admin.deleteUser(data.user_id);
    if (delErr) return { error: delErr.message };

    return { success: true };
  });
