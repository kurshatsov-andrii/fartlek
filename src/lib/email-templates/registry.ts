import type * as React from "react";

import { template as paymentReminder } from "./payment-reminder";
import { template as receiptReminder } from "./receipt-reminder";

export interface TemplateEntry {
  component: React.ComponentType<Record<string, unknown>>;
  subject: string | ((data: Record<string, unknown>) => string);
  to?: string;
  displayName?: string;
  previewData?: Record<string, unknown>;
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  "payment-reminder": paymentReminder,
  "receipt-reminder": receiptReminder,
};
