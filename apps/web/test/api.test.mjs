import { test } from "node:test";
import assert from "node:assert/strict";
import { api, dateLabel, timeLabel, initials, money } from "../src/lib/api.ts";

test("match times always use Vietnam timezone, including a UTC date boundary", () => {
  assert.match(dateLabel("2026-10-27T18:30:00Z"), /28\/10/);
  assert.equal(timeLabel("2026-10-27T18:30:00Z"), "01:30");
  assert.equal(money(0), "Miễn phí");
  assert.equal(money(70000), "70.000đ");
  assert.equal(initials("Nguyễn Minh Anh"), "MA");
});
test("API sends the session and CSRF header and exposes server validation messages", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    sent = { url, options };
    return new Response(
      JSON.stringify({ message: ["Invalid date", "Invalid capacity"] }),
      { status: 400 },
    );
  });
  await assert.rejects(
    api("/matches", { method: "POST", body: "{}" }),
    /Invalid date · Invalid capacity/,
  );
  assert.equal(sent.url, "/api/matches");
  assert.equal(sent.options.headers["X-KT-Client"], "web");
  assert.equal(sent.options.credentials, "same-origin");
});
