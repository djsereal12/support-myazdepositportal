import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_property",
  title: "Create property",
  description: "Add a rental property to the signed-in user's deposit account.",
  inputSchema: {
    address: z.string().trim().min(1).describe("Street address of the rental."),
    unit: z.string().trim().optional().describe("Unit or apartment number."),
    deposit_amount: z.number().nonnegative().optional().describe("Security deposit amount in dollars."),
    lease_start: z.string().optional().describe("Lease start date, YYYY-MM-DD."),
    lease_end: z.string().optional().describe("Lease end date, YYYY-MM-DD."),
    landlord_name: z.string().trim().optional(),
    landlord_email: z.string().trim().email().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("properties")
      .insert({ ...input, user_id: ctx.getUserId()! })
      .select("id, address, unit, deposit_amount, lease_start, lease_end")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { property: data },
    };
  },
});
