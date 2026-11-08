const esc = (s: unknown) =>
  String(s ?? "—").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const CAT: Record<string, string> = { men: "Чоловіки", women: "Жінки", mix: "Мікс" };
const PAY: Record<string, string> = { paid: "Оплачено", confirmed: "Оплачено", pending: "Очікує" };

/** Opens a printable teams table; the browser print dialog offers "Save as PDF". */
export function printRelayTeams(eventTitle: string, distanceLabel: string, list: any[], showPayment: boolean) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = list
    .map((r) => {
      const members: any[] = Array.isArray(r.relay_members) ? r.relay_members : [];
      const ms = members
        .map((m, i) => `${i + 1}. <b>${esc(m.full_name)}</b> — ${esc(m.leg_km)} км${m.gender ? ` (${m.gender === "male" ? "Ч" : m.gender === "female" ? "Ж" : esc(m.gender)})` : ""}`)
        .join("<br/>");
      return `<tr><td class="b">${esc(r.bib_number)}</td><td><b>${esc(r.team_name)}</b></td><td>${esc(CAT[r.team_category] ?? "—")}</td><td>${ms || "—"}</td>${showPayment ? `<td>${esc(PAY[r.payment_status] ?? r.payment_status)}</td>` : ""}</tr>`;
    })
    .join("");
  w.document.write(`<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${esc(eventTitle)} — команди ${esc(distanceLabel)}</title>
<style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;color:#111;font-size:11px}h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px;color:#555}
table{width:100%;border-collapse:collapse}th{background:#f97316;color:#fff;text-align:left;-webkit-print-color-adjust:exact;print-color-adjust:exact}
th,td{border:1px solid #999;padding:5px;vertical-align:top}tr{break-inside:avoid}.b{font-weight:bold;color:#c2410c}</style></head><body>
<h1>${esc(eventTitle)} — команди</h1><p>Дистанція: ${esc(distanceLabel)} · Усього команд: ${list.length}</p>
<table><thead><tr><th>#</th><th>Назва команди</th><th>Категорія</th><th>Учасники (етапи)</th>${showPayment ? "<th>Оплата</th>" : ""}</tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=()=>setTimeout(()=>window.print(),200)</script></body></html>`);
  w.document.close();
}
