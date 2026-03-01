import fs from "node:fs/promises";
import crypto from "node:crypto";

const ROOM_ID = process.env.RECNET_ROOM_ID || "327347949182124365";
const OUT_FILE = "data/events.json";
const ERROR_FILE = "data/events_error.json";

const EVENTS_URL = `https://api.rec.net/api/playerevents/v1/room/${encodeURIComponent(ROOM_ID)}`;

async function readJson(path) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch {
    return null;
  }
}

function stableHash(obj) {
  const s = JSON.stringify(obj);
  return crypto.createHash("sha256").update(s).digest("hex");
}

async function writeJson(path, obj) {
  await fs.mkdir("data", { recursive: true });
  await fs.writeFile(path, JSON.stringify(obj, null, 2));
}

async function main() {
  const res = await fetch(EVENTS_URL, {
    headers: { "Accept": "application/json" },
  });

  const text = await res.text();

  if (!res.ok) {
    const errPayload = {
      ok: false,
      fetchedAt: new Date().toISOString(),
      roomId: ROOM_ID,
      url: EVENTS_URL,
      status: res.status,
      bodyPreview: text.slice(0, 5000),
    };
    await writeJson(ERROR_FILE, errPayload);
    console.error(`RecNet events fetch failed: HTTP ${res.status}`);
    process.exit(2);
  }

  let events;
  try {
    events = JSON.parse(text);
  } catch {
    const errPayload = {
      ok: false,
      fetchedAt: new Date().toISOString(),
      roomId: ROOM_ID,
      url: EVENTS_URL,
      status: res.status,
      bodyPreview: text.slice(0, 5000),
      parseError: "Invalid JSON from server",
    };
    await writeJson(ERROR_FILE, errPayload);
    console.error("RecNet returned invalid JSON.");
    process.exit(3);
  }

  const payload = {
    ok: true,
    fetchedAt: new Date().toISOString(),
    roomId: ROOM_ID,
    events,
  };

  const prev = await readJson(OUT_FILE);
  const prevHash = prev ? stableHash(prev) : null;
  const newHash = stableHash(payload);

  if (prevHash === newHash) {
    console.log("No changes in events.json; skipping write.");
    try { await fs.unlink(ERROR_FILE); } catch {}
    return;
  }

  await writeJson(OUT_FILE, payload);
  try { await fs.unlink(ERROR_FILE); } catch {}

  console.log(`Updated ${OUT_FILE} (${Array.isArray(events) ? events.length : 0} events).`);
}

main().catch(async (e) => {
  await writeJson(ERROR_FILE, {
    ok: false,
    fetchedAt: new Date().toISOString(),
    roomId: ROOM_ID,
    fatal: String(e?.stack || e),
  });
  console.error(e);
  process.exit(10);
});