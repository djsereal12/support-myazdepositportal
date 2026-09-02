import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Page } from "@/components/site-shell";
import { MediaThumb } from "@/components/media-image";
import { supabase } from "@/integrations/supabase/client";
import { CHECKLIST, compareConditions, shortHash, type DamageFlag } from "@/lib/deposit";

export const Route = createFileRoute("/_authenticated/compare/$propertyId")({
  head: () => ({
    meta: [
      { title: "Move-in vs move-out — DEPOSIT" },
      { name: "description", content: "Side-by-side comparison with new damage and pre-existing flags." },
      { property: "og:title", content: "Move-in vs move-out — DEPOSIT" },
      { property: "og:description", content: "See exactly what changed, room by room." },
    ],
  }),
  component: Compare,
});

const flagStyle: Record<DamageFlag, string> = {
  "No Change": "bg-success/15 text-foreground",
  "New Damage": "bg-destructive/12 text-destructive",
  "Pre-existing": "bg-lavender-soft text-accent-foreground",
};

function Compare() {
  const { propertyId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["comparison", propertyId],
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from("reports")
        .select("id, type, created_at, report_number")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const moveIn = reports.find((r) => r.type === "move_in");
      const moveOut = reports.find((r) => r.type === "move_out");
      const ids = [moveIn?.id, moveOut?.id].filter(Boolean) as string[];
      if (!ids.length) return { moveIn, moveOut, media: [] };

      const { data: media, error: mErr } = await supabase
        .from("media")
        .select("*")
        .in("report_id", ids);
      if (mErr) throw mErr;
      return { moveIn, moveOut, media };
    },
  });

  const inMap = new Map(
    (data?.media ?? []).filter((m) => m.report_id === data?.moveIn?.id).map((m) => [m.room_label, m]),
  );
  const outMap = new Map(
    (data?.media ?? []).filter((m) => m.report_id === data?.moveOut?.id).map((m) => [m.room_label, m]),
  );

  return (
    <Page>
      <Link
        to="/properties/$propertyId"
        params={{ propertyId }}
        className="text-xs text-muted-foreground underline underline-offset-4"
      >
        ← Property file
      </Link>
      <h1 className="mt-5 text-4xl font-semibold">Move-in vs. move-out</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Each row pairs the same checklist item across both scans and flags what changed.
      </p>

      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : !data?.moveIn || !data?.moveOut ? (
        <div className="glass-panel mt-8 p-8">
          <p className="text-sm text-muted-foreground">
            You need a completed move-in scan and a completed move-out scan before the comparison
            can be built.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {CHECKLIST.map((room) => {
            const a = inMap.get(room);
            const b = outMap.get(room);
            const flag = compareConditions(a?.condition, b?.condition);
            return (
              <article key={room} className="glass-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{room}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] ${flagStyle[flag]}`}
                  >
                    {flag}
                  </span>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Side label="Move-in" item={a} room={room} />
                  <Side label="Move-out" item={b} room={room} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function Side({
  label,
  item,
  room,
}: {
  label: string;
  item: { file_url: string; condition: string; note: string | null; file_hash_sha256: string | null } | undefined;
  room: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {item ? (
        <>
          <MediaThumb path={item.file_url} alt={`${label} ${room}`} className="mt-3 h-40 w-full" />
          <p className="mt-3 text-sm font-medium">{item.condition}</p>
          <p className="text-xs text-muted-foreground">{item.note || "No note"}</p>
          <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
            {shortHash(item.file_hash_sha256)}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Not captured</p>
      )}
    </div>
  );
}
