import { Link } from "@tanstack/react-router";

/** Deterministic pseudo-QR block used as an illustrative verification code. */
export function FauxQr({ size = 21, seed = 7 }: { size?: number; seed?: number }) {
  const cells: boolean[] = [];
  let x = seed;
  for (let i = 0; i < size * size; i += 1) {
    x = (x * 1103515245 + 12345) % 2147483648;
    cells.push((x >> 8) % 3 !== 0);
  }
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const rel = (br: number, bc: number) => ({ dr: r - br, dc: c - bc });
    const boxes: Array<[number, number]> = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0],
    ];
    for (const [br, bc] of boxes) {
      const { dr, dc } = rel(br, bc);
      if (dr < 0 || dr > 6 || dc < 0 || dc > 6) continue;
      const edge = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      return edge || core;
    }
    return false;
  };

  return (
    <div
      aria-hidden
      className="grid gap-[1px] rounded-lg bg-card p-2"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / size);
        const c = i % size;
        const filled = isFinder(r, c) ? finderOn(r, c) : on;
        return (
          <span
            key={i}
            className={`aspect-square rounded-[1px] ${filled ? "bg-foreground" : "bg-transparent"}`}
          />
        );
      })}
    </div>
  );
}

/** A redacted, illustrative court-ready report page. */
export function SampleReportSheet() {
  const rows: Array<[string, string, string]> = [
    ["Front door & locks", "Good", "9f21c4a1…b7e2"],
    ["Kitchen — under sink", "Fair", "2d80e5cc…41af"],
    ["Kitchen — stovetop & oven", "Good", "7be14a09…9c33"],
    ["Bathroom — caulk & grout", "Damaged", "c41f77b2…0d18"],
    ["Floors", "Good", "5aa9038e…be71"],
    ["Walls & ceilings", "Fair", "18cc72d4…4a90"],
    ["Windows", "Good", "e0b34517…7712"],
    ["Appliances", "Good", "aa47b1de…3fc5"],
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-lift sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[0.62rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Move-in inspection report
          </p>
          <h3 className="mt-2 text-xl font-semibold">Report AZ-2026-004182</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            ███ E Roosevelt St, Unit ██ · Phoenix, AZ 85██
          </p>
        </div>
        <div className="w-24">
          <FauxQr />
          <p className="mt-1 text-center text-[0.55rem] uppercase tracking-widest text-muted-foreground">
            Scan to verify
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
        {[
          ["Sealed", "Mar 3, 2026 8:14 AM MST"],
          ["GPS", "33.4576° N, 112.0▮▮° W"],
          ["Weather at capture", "112°F Clear — Phoenix, AZ"],
          ["Device", "iPhone 15 / Safari 17.4"],
          ["Media files", "24 photos · 3 videos"],
          ["Overall report hash", "b41e9a77…ce20"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-background/60 p-3">
            <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
            <dd className="mt-1 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <table className="mt-6 w-full text-left text-xs">
        <thead className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
          <tr>
            <th className="pb-2">Area</th>
            <th className="pb-2">Condition</th>
            <th className="pb-2">SHA-256</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(([area, cond, hash]) => (
            <tr key={area}>
              <td className="py-2 pr-3">{area}</td>
              <td className="py-2 pr-3">{cond}</td>
              <td className="py-2 font-mono text-[0.68rem] text-muted-foreground">{hash}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
        {["Tenant signature", "Landlord signature"].map((label) => (
          <div key={label}>
            <div className="h-10 border-b border-dashed border-border" />
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
              {label} · date
            </p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[0.65rem] leading-relaxed text-muted-foreground">
        Prepared under A.R.S. § 33-1321. Landlord must return the deposit, less itemized deductions,
        within 14 business days of termination and receipt of a forwarding address. Wrongfully
        withheld amounts may be recovered up to twice the amount withheld under § 33-1321(E). This
        document is evidence, not legal advice.{" "}
        <Link to="/law" className="underline">
          Read the statute
        </Link>
        .
      </p>
    </div>
  );
}
