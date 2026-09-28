// Notifications are derived from real app state — never invented copy.
// v1 has no accounts (Build Decisions Log), so these aggregate across every
// business in this deployment, the same "no login yet" model page.tsx and
// Profile already use for listBusinesses(). Two kinds, both computed:
//  - open action items: straight count of items still "open"/"in_progress"
//  - reassessment due: cycle_started_at + cycle_length_days (120) has passed
import { listBusinesses, getLatestAssessment, getLatestPlan } from "./db";
import type { Language } from "./types";
import { tf } from "./ui-copy";

export interface Notification {
  id: string;
  business_id: string;
  business_name: string;
  kind: "open_actions" | "reassessment_due";
  text: string;
  href: string;
}

const CYCLE_LENGTH_DAYS = 120;

export function getNotifications(language: Language = "en"): Notification[] {
  const notifications: Notification[] = [];

  for (const business of listBusinesses()) {
    const assessment = getLatestAssessment(business.id);
    if (!assessment) continue;

    const plan = getLatestPlan(business.id);
    if (plan) {
      const openCount = plan.action_plan.filter((i) => i.state !== "resolved").length;
      if (openCount > 0) {
        notifications.push({
          id: `open__${business.id}`,
          business_id: business.id,
          business_name: business.name,
          kind: "open_actions",
          text: tf("notifications.openActions", language, { name: business.name, count: openCount, plural: openCount > 1 ? "s" : "" }),
          href: `/plan/${business.id}`,
        });
      }

      const started = new Date(plan.cycle_started_at).getTime();
      const dueAt = started + CYCLE_LENGTH_DAYS * 24 * 60 * 60 * 1000;
      const daysLeft = Math.ceil((dueAt - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysLeft <= 0) {
        notifications.push({
          id: `reassess__${business.id}`,
          business_id: business.id,
          business_name: business.name,
          kind: "reassessment_due",
          text: tf("notifications.reassessOverdue", language, { name: business.name }),
          href: `/reassess/${business.id}`,
        });
      } else if (daysLeft <= 14) {
        notifications.push({
          id: `reassess__${business.id}`,
          business_id: business.id,
          business_name: business.name,
          kind: "reassessment_due",
          text: tf("notifications.reassessDue", language, { name: business.name, days: daysLeft, plural: daysLeft > 1 ? "s" : "" }),
          href: `/reassess/${business.id}`,
        });
      }
    }
  }

  return notifications;
}
