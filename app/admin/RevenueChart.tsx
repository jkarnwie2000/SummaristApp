import { formatPrice } from "@/lib/catalog";

type Day = { date: string; revenue: number; orders: number };

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Single-series daily revenue bars with hover/focus tooltips and a table view. */
export default function RevenueChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 0);
  // Round the axis top up to a "nice" number of dollars.
  const step = niceStep(max / 100 / 4);
  const top = Math.max(step * 4, 1) * 100;
  const ticks = [0, 1, 2, 3, 4].map((i) => (top / 4) * i);

  return (
    <div className="rev-chart">
      <div className="rev-chart__plot" role="img" aria-label="Daily revenue bar chart; see table below for values">
        <div className="rev-chart__grid" aria-hidden="true">
          {ticks
            .slice()
            .reverse()
            .map((t) => (
              <div className="rev-chart__gridline" key={t}>
                <span className="rev-chart__tick">{formatPrice(t).replace(/\.00$/, "")}</span>
              </div>
            ))}
        </div>
        <div className="rev-chart__bars">
          {data.map((d, i) => (
            <div className="rev-chart__col" key={d.date} tabIndex={0}>
              <div
                className="rev-chart__bar"
                style={{ height: `${(d.revenue / top) * 100}%` }}
              />
              <div className="rev-chart__tooltip" role="tooltip">
                <strong>{dayLabel(d.date)}</strong>
                <span>{formatPrice(d.revenue)}</span>
                <span className="shop-muted">
                  {d.orders} {d.orders === 1 ? "order" : "orders"}
                </span>
              </div>
              <span className="rev-chart__xlabel" aria-hidden="true">
                {i % 2 === (data.length - 1) % 2 ? dayLabel(d.date) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
      <details className="rev-chart__table">
        <summary>Show as table</summary>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="num">Orders</th>
              <th className="num">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{dayLabel(d.date)}</td>
                <td className="num">{d.orders}</td>
                <td className="num">{formatPrice(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function niceStep(raw: number) {
  if (raw <= 0) return 25;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
}
