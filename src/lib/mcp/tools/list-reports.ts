import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_reports",
  title: "List inspection reports",
  description: "List the signed-in user's move-in / move-out inspection reports, optionally filtered by property or type.",
  inputSchema: {
    property_id: z.string().uuid().optional().describe("Only return reports for this property."),
    type: z.enum(["move_in", "move_out"]).optional().describe("Filter by report type."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ property_id, type }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("reports")
      .select("id, report_number, type, status, property_id, overall_hash, created_at, properties(address, unit)")
      .order("created_at", { ascending: false });
    if (property_id) query = query.eq("property_id", property_id);
    if (type) query = query.eq("type", type);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { reports: data ?? [] },
    };
  },
});
