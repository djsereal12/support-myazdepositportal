import type { ComponentType } from "react";
import { template as welcomeTemplate } from "./welcome";
import { template as reportReadyTemplate } from "./report-ready";
import { template as landlordResponseTemplate } from "./landlord-response";
import { template as landlordInviteTemplate } from "./landlord-invite";
import { template as demandLetterTemplate } from "./demand-letter";
import { template as nudgeFirstScanTemplate } from "./nudge-first-scan";
import { template as moveOutDeadlineTemplate } from "./moveout-deadline";
import { template as depositClaimTemplate } from "./deposit-claim";

export interface TemplateEntry {
  component: ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome: welcomeTemplate,
  "report-ready": reportReadyTemplate,
  "landlord-response": landlordResponseTemplate,
  "landlord-invite": landlordInviteTemplate,
  "demand-letter": demandLetterTemplate,
  "nudge-first-scan": nudgeFirstScanTemplate,
  "moveout-deadline": moveOutDeadlineTemplate,
  "deposit-claim": depositClaimTemplate,
};
