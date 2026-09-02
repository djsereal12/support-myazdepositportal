export const CHECKLIST: string[] = [
  "Kitchen - Under Sink (film 5 sec)",
  "Kitchen - Stovetop & Oven Interior",
  "Bathroom 1 - Shower Caulk & Grout",
  "Bathroom 1 - Behind Toilet",
  "Living Room - Walls & Floor",
  "Bedroom - Closet Interior",
  "Front Door & Locks",
  "Water Heater & AC Unit",
];

export const CONDITIONS = ["Good", "Fair", "Damaged"] as const;
export type Condition = (typeof CONDITIONS)[number];

export type Coords = { lat: number | null; lng: number | null };

export async function getCoords(): Promise<Coords> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { lat: null, lng: null };
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ lat: null, lng: null }), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        resolve({ lat: null, lng: null });
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  });
}

export function deviceModel(): string {
  if (typeof navigator === "undefined") return "unknown";
  return navigator.userAgent;
}

export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Mock weather snapshot — swap for a live feed later. */
export function weatherSnapshot(): string {
  const month = new Date().getMonth();
  const temp = month >= 4 && month <= 8 ? 104 + Math.floor(Math.random() * 12) : 68 + Math.floor(Math.random() * 14);
  const sky = temp > 100 ? "Clear" : "Partly Cloudy";
  return `${temp}°F ${sky} - Phoenix, AZ`;
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…${hash.slice(-4)}`;
}

export function money(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(n ?? 0));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const REPORT_TYPE_LABEL: Record<string, string> = {
  move_in: "Move-In",
  move_out: "Move-Out",
  comparison: "Comparison",
};

/** 14 business days from a date, skipping weekends. */
export function businessDaysFrom(start: Date, days = 14): Date {
  const d = new Date(start);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

export type DamageFlag = "No Change" | "New Damage" | "Pre-existing";

/** Heuristic comparison flag between a move-in and move-out capture. */
export function compareConditions(
  moveIn: string | undefined,
  moveOut: string | undefined,
): DamageFlag {
  const rank: Record<string, number> = { Good: 0, Fair: 1, Damaged: 2 };
  if (!moveIn || !moveOut) return "No Change";
  const a = rank[moveIn] ?? 0;
  const b = rank[moveOut] ?? 0;
  if (b > a) return "New Damage";
  if (a > 0) return "Pre-existing";
  return "No Change";
}
