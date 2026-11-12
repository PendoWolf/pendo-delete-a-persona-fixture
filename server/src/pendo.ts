// Server-side Pendo Track Events, sent to the Pendo Track API over HTTP.
//
// Configuration (read from the environment, never committed):
//   PENDO_TRACK_EVENT_SECRET  Track Event shared secret (integration key). Tracking is a no-op when unset.
//   PENDO_DATA_HOST           Pendo data host (default: data.pendo-dev.pendo-dev.com)
const PENDO_TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;
const PENDO_DATA_HOST = process.env.PENDO_DATA_HOST || "data.pendo-dev.pendo-dev.com";

type TrackProperties = Record<string, string | number | boolean>;

interface TrackOptions {
  visitorId?: string;
  accountId?: string;
  properties?: TrackProperties;
}

// Fire-and-forget: tracking failures are logged and never break the request.
export function pendoTrack(event: string, { visitorId, accountId, properties = {} }: TrackOptions = {}) {
  if (!PENDO_TRACK_EVENT_SECRET) return;

  fetch(`https://${PENDO_DATA_HOST}/data/track`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pendo-integration-key": PENDO_TRACK_EVENT_SECRET,
    },
    body: JSON.stringify({
      type: "track",
      event,
      // The API has no visitor or account context, so fall back to "system".
      visitorId: visitorId || "system",
      accountId: accountId || "system",
      timestamp: Date.now(),
      properties,
    }),
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) console.error(`Pendo track "${event}" failed: ${res.status}`);
    })
    .catch((err: unknown) => {
      console.error(`Pendo track "${event}" failed:`, err);
    });
}
