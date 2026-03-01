// scripts/fetch-recnet-events.mjs
import fs from "node:fs/promises";

const ROOM_ID = process.env.RECNET_ROOM_ID; // set in GitHub Action
if (!ROOM_ID) {
  console.error("Missing RECNET_ROOM_ID env var.");
  process.exit(1);
}

const url = `https://api.rec.net/api/playerevents/v1/room/${encodeURIComponent(ROOM_ID)}`;

async function main() {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  const text = await res.text();

  if (!res.ok) {
    // Save debug info so you can see what RecNet returned
    await fs.mkdir("data", { recursive: true });
    await fs.writeFile(
      "data/events_error.json",
      JSON.stringify(
        { ok: false, status: res.status, url, body: text.slice(0, 5000) },
        null,
        2
      )
    );
    console.error(`RecNet returned HTTP ${res.status}. See data/events_error.json`);
    process.exit(2);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("Response was not valid JSON.");
    process.exit(3);
  }

  const payload = {
    fetchedAt: new Date().toISOString(),
    roomId: ROOM_ID,
    events: json,
  };

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile("data/events.json", JSON.stringify(payload, null, 2));
  console.log(`Saved ${Array.isArray(json) ? json.length : 0} events to data/events.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(10);
});