import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPropertiesTool from "./tools/list-properties";
import createPropertyTool from "./tools/create-property";
import listReportsTool from "./tools/list-reports";
import getReportTool from "./tools/get-report";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "deposit",
  title: "Deposit",
  version: "0.1.0",
  instructions:
    "Tools for deposit, an Arizona move-in / move-out documentation app. Use `list_properties` and `create_property` to manage rentals, `list_reports` to find inspection reports, and `get_report` to read a report's tamper-evident hash and documented items.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPropertiesTool, createPropertyTool, listReportsTool, getReportTool],
});
