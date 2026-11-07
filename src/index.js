// Cloudflare Worker: obsługuje /api/submit i /api/slots. Strona statyczna jest w katalogu public/.
// Sekrety: RESEND_API_KEY, TO_EMAIL, FROM_EMAIL. Baza KV (BOOKINGS) tworzy się sama przy deployu.

const LABELS = {
  imie: "Imię i nazwisko", firma: "Firma", email: "E-mail", telefon: "Telefon",
  impreza: "Impreza", rodzaj: "Rodzaj", data: "Data imprezy", miejsce: "Miejsce",
  uczestnicy: "Uczestnicy", godziny: "Godziny", dokumentacja: "Dokumentacja",
  forma: "Forma spotkania", termin: "Termin", pora: "Pora", wiadomosc: "Wiadomość",
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function slots(url, env) {
  const date = url.searchParams.get("date") || "";
  let booked = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && env.BOOKINGS) {
    const list = await env.BOOKINGS.list({ prefix: `slot:${date}:` });
    booked = list.keys.map((k) => k.name.split(":").slice(2).join(":"));
  }
  return json({ booked });
}

async function submit(request, env) {
  let d;
  try { d = await request.json(); } catch { return json({ error: "Zły format" }, 400); }
  if (d.website) return json({ ok: true });
  if (!d.zgoda || !d.email || !d.imie) return json({ error: "Brak wymaganych pól" }, 400);
  const typ = ["Wycena", "Spotkanie", "Kontakt"].includes(d.typ) ? d.typ : "Kontakt";

  if (typ === "Spotkanie") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.termin || "") || !/^\d{1,2}:00$/.test(d.pora || "")) return json({ error: "Zły termin" }, 400);
    if (env.BOOKINGS) {
      const key = `slot:${d.termin}:${d.pora}`;
      if (await env.BOOKINGS.get(key)) return json({ error: "Termin zajęty" }, 409);
      await env.BOOKINGS.put(key, String(d.email).slice(0, 200), { expirationTtl: 60 * 60 * 24 * 120 });
    }
  }

  const rows = Object.keys(LABELS).filter((k) => d[k])
    .map((k) => `<tr><td><b>${LABELS[k]}</b></td><td>${esc(String(d[k]).slice(0, 3000))}</td></tr>`).join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.FROM_EMAIL, to: [env.TO_EMAIL], reply_to: String(d.email).slice(0, 200),
      subject: `[Strona] ${typ}: ${String(d.imie).slice(0, 80)}`,
      html: `<table cellpadding="6" border="1" style="border-collapse:collapse">${rows}</table>`,
    }),
  });
  return res.ok ? json({ ok: true }) : json({ error: "Nie udało się wysłać" }, 502);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/slots" && request.method === "GET") return slots(url, env);
    if (url.pathname === "/api/submit" && request.method === "POST") return submit(request, env);
    return env.ASSETS.fetch(request);
  },
};
