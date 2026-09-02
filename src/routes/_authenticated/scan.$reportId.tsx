import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { MediaThumb } from "@/components/media-image";
import { supabase } from "@/integrations/supabase/client";
import {
  CHECKLIST,
  CONDITIONS,
  getCoords,
  deviceModel,
  sha256,
  weatherSnapshot,
  shortHash,
  REPORT_TYPE_LABEL,
  type Condition,
} from "@/lib/deposit";
import { sendReportReadyEmail } from "@/utils/notifications.functions";
import { Camera, Check, Loader2, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/scan/$reportId")({
  head: () => ({
    meta: [
      { title: "Guided scan — deposit" },
      { name: "description", content: "Capture every room the guided way: hashed, stamped and sealed." },
      { property: "og:title", content: "Guided scan — deposit" },
      { property: "og:description", content: "Eight prompts, tamper-proof evidence." },
    ],
  }),
  component: Scan,
});

function Scan() {
  const { reportId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState<string | null>(null);
  const [sealing, setSealing] = useState(false);

  const { data: report } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, properties(*)")
        .eq("id", reportId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: media } = useQuery({
    queryKey: ["media", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const byRoom = new Map((media ?? []).map((m) => [m.room_label, m]));
  const done = CHECKLIST.filter((r) => byRoom.has(r)).length;
  const progress = Math.round((done / CHECKLIST.length) * 100);
  const complete = done === CHECKLIST.length;

  async function handleUpload(room: string, file: File) {
    setUploading(room);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user!.id;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${uid}/${reportId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      const coords = await getCoords();
      const capturedAt = Date.now();
      const hash = await sha256(`${path}|${capturedAt}|${file.size}|${deviceModel()}`);

      const { error } = await supabase.from("media").insert({
        report_id: reportId,
        user_id: uid,
        room_label: room,
        condition: "Good",
        file_url: path,
        file_hash_sha256: hash,
        device_model: deviceModel().slice(0, 300),
        gps_lat: coords.lat,
        gps_lng: coords.lng,
        exif_timestamp: new Date(capturedAt).toISOString(),
      });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["media", reportId] });
      toast.success("Captured, hashed and stamped");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function update(id: string, patch: { condition?: Condition; note?: string }) {
    const { error } = await supabase.from("media").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["media", reportId] });
  }

  async function seal() {
    if (!complete) return;
    setSealing(true);
    try {
      const hashes = CHECKLIST.map((r) => byRoom.get(r)?.file_hash_sha256 ?? "").join("|");
      const overall = await sha256(hashes);
      const coords = await getCoords();
      const first = byRoom.get(CHECKLIST[0]!);
      const { error } = await supabase
        .from("reports")
        .update({
          overall_hash: overall,
          gps_lat: coords.lat ?? first?.gps_lat ?? null,
          gps_lng: coords.lng ?? first?.gps_lng ?? null,
          weather_snapshot: weatherSnapshot(),
          qr_verification_url: `${window.location.origin}/verify/${reportId}`,
          status: "complete",
        })
        .eq("id", reportId);
      if (error) throw error;

      if (report?.property_id) {
        await supabase
          .from("properties")
          .update({ status: report.type === "move_out" ? "complete" : "move_in_complete" })
          .eq("id", report.property_id);
      }
      void sendReportReadyEmail({ data: { reportId } }).catch(() => {});
      await queryClient.invalidateQueries();
      navigate({ to: "/reports/$reportId", params: { reportId } });

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not seal report");
    } finally {
      setSealing(false);
    }
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {report ? `${report.report_number} · ${REPORT_TYPE_LABEL[report.type]} scan` : "Loading…"}
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Guided capture</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Every upload is fingerprinted with SHA-256 and stamped with your GPS position, device and
        the exact capture time. Finish all eight to seal the report.
      </p>

      <div className="glass-panel sticky top-24 z-40 mt-8 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {done} of {CHECKLIST.length} captured
          </span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-lavender transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={seal}
          disabled={!complete || sealing}
          className="mt-5 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {sealing
            ? "Sealing report…"
            : complete
              ? "Seal report & generate PDF"
              : `Capture ${CHECKLIST.length - done} more to finish`}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {CHECKLIST.map((room, i) => {
          const item = byRoom.get(room);
          return (
            <ChecklistCard
              key={room}
              index={i + 1}
              room={room}
              item={item}
              uploading={uploading === room}
              onFile={(f) => handleUpload(room, f)}
              onUpdate={update}
            />
          );
        })}
      </div>
    </Page>
  );
}

type MediaRow = {
  id: string;
  file_url: string;
  file_hash_sha256: string | null;
  condition: string;
  note: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
};

function ChecklistCard({
  index,
  room,
  item,
  uploading,
  onFile,
  onUpdate,
}: {
  index: number;
  room: string;
  item: MediaRow | undefined;
  uploading: boolean;
  onFile: (f: File) => void;
  onUpdate: (id: string, patch: { condition?: Condition; note?: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <article className="glass-panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              item ? "bg-lavender text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {item ? <Check className="h-4 w-4" /> : index}
          </span>
          <div>
            <h2 className="text-lg font-semibold leading-snug">{room}</h2>
            {item ? (
              <p className="mt-1 font-mono text-[0.7rem] text-muted-foreground">
                {shortHash(item.file_hash_sha256)}
                {item.gps_lat ? (
                  <span className="ml-3 inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.gps_lat.toFixed(4)}, {item.gps_lng?.toFixed(4)}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Photo or short video</p>
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {item ? "Replace" : "Capture"}
        </button>
      </div>

      {item ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-[140px_1fr]">
          <MediaThumb path={item.file_url} alt={room} className="h-32 w-full sm:w-[140px]" />
          <div className="space-y-3">
            <div className="flex gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdate(item.id, { condition: c })}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    item.condition === c
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card hover:bg-accent"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <textarea
              defaultValue={item.note ?? ""}
              onBlur={(e) => onUpdate(item.id, { note: e.target.value.slice(0, 500) })}
              placeholder="Note (e.g. hairline crack left of the valve)"
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
