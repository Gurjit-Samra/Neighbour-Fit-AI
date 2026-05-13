import { db } from "@workspace/db";
import { analyticsEventsTable } from "@workspace/db";
import { logger } from "./logger";

export type EventName =
  | "questionnaire_started"
  | "questionnaire_completed"
  | "recommendations_generated"
  | "neighborhood_saved"
  | "comparison_started"
  | "registration_completed"
  | "login_completed"
  | "admin_neighborhood_updated"
  | "ai_summary_generated"
  | "ai_summary_cache_hit"
  | "ai_summary_cache_miss";

export async function trackEvent(
  eventName: EventName,
  opts: {
    userId?: number | null;
    guestSessionId?: string | null;
    payload?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await db.insert(analyticsEventsTable).values({
      eventName,
      userId: opts.userId ?? null,
      guestSessionId: opts.guestSessionId ?? null,
      eventPayload: opts.payload ?? null,
    });
  } catch (err) {
    logger.error({ err, eventName }, "Failed to track analytics event");
  }
}
