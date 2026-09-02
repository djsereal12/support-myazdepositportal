import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_report",
  title: "Get report details",
  description:
    "Get one inspection report with its property, tamper-evident hash, and every documented item (room, condition, notes, GPS, timestamps, photo hash).",
  inputSchema: { report_id: z.string().uuid().describe("The report id.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ report_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: report, error } = await supabase
      .from("reports")
      .select(
        "id, report_number, type, status, overall_hash, gps_lat, gps_lng, weather_snapshot, created_at, properties(address, unit, deposit_amount, landlord_name, landlord_email)",
      )
      .eq("id", report_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!report) return { content: [{ type: "text", text: "Report not found" }], isError: true };

    const { data: media, error: mediaError } = await supabase
      .from("media")
      .select("id, room_label, condition, note, gps_lat, gps_lng, exif_timestamp, device_model, file_hash_sha256, created_at")
      .eq("report_id", report_id)
      .order("created_at", { ascending: true });
    if (mediaError) return { content: [{ type: "text", text: mediaError.message }], isError: true };

    const payload = { report, items: media ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
