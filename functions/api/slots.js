// GET /api/slots?date=YYYY-MM-DD -> { booked: ["9:00", "14:00"] }
// Wymaga powiązania KV o nazwie BOOKINGS (bez niego wszystkie godziny są wolne).
export async function onRequestGet({ request, env }) {
  const date = new URL(request.url).searchParams.get("date") || "";
  let booked = [];
  if (/^\d{4}-\d{2}-\d{2}$/.test(date) && env.BOOKINGS) {
    const list = await env.BOOKINGS.list({ prefix: `slot:${date}:` });
    booked = list.keys.map((k) => k.name.split(":").slice(2).join(":"));
  }
  return new Response(JSON.stringify({ booked }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
