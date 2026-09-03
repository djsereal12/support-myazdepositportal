import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Page } from "@/components/site-shell";
import { amIAdmin, listUsers, deleteUser } from "@/utils/admin.functions";
import { formatDate } from "@/lib/deposit";
import { toast } from "sonner";
import { ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — deposit" },
      { name: "description", content: "Review every deposit account and clear test data." },
      { property: "og:title", content: "Admin console — deposit" },
      { property: "og:description", content: "User administration for deposit." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const fetchUsers = useServerFn(listUsers);
  const removeUser = useServerFn(deleteUser);

  const { data: gate, isLoading: gateLoading } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    enabled: Boolean(gate?.admin),
    queryFn: () => fetchUsers(),
  });

  async function onDelete(id: string, email: string | null) {
    if (!confirm(`Permanently delete ${email ?? id} and all of their data?`)) return;
    try {
      await removeUser({ data: { userId: id } });
      toast.success("Account deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
    }
  }

  if (gateLoading) {
    return (
      <Page>
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </Page>
    );
  }

  if (!gate?.admin) {
    return (
      <Page>
        <div className="glass-panel p-10">
          <ShieldCheck className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h1 className="mt-5 text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This console is limited to accounts listed as administrators.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Users</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Every signed-up account with role, activity and confirmation status. Deleting an account
        removes its auth record and cascading data.
      </p>
      <a
        href="/marketing"
        className="glass-button mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-medium"
      >
        Marketing emails
      </a>


      {isLoading ? (
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="glass-panel mt-8 overflow-x-auto p-2">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead>
              <tr className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Properties</th>
                <th className="px-4 py-3 font-medium">Reports</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last sign-in</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {u.full_name || "No name"}
                      {u.phone ? ` · ${u.phone}` : ""}
                      {u.email_confirmed ? "" : " · unconfirmed"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.roles.length ? u.roles.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3">{u.properties}</td>
                  <td className="px-4 py-3">{u.reports}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.created_at ? formatDate(u.created_at) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(u.id, u.email)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-lavender"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
