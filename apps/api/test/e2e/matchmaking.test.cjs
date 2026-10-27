const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, randomBytes } = require("node:crypto");
const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const { once } = require("node:events");
const { Client } = require("pg");
const { DataSource } = require("typeorm");
const { config } = require("dotenv");
const apiRoot = path.resolve(__dirname, "../..");
config({ path: path.join(apiRoot, ".env"), quiet: true });

test(
  "PostgreSQL HTTP integration: identity, permissions, roster limits and concurrent approvals",
  { timeout: 90000 },
  async (t) => {
    const database = `keo_test_${randomUUID().replaceAll("-", "")}`;
    const connection = {
      host: process.env.DATABASE_HOST ?? "localhost",
      port: Number(process.env.DATABASE_PORT ?? 55432),
      user: process.env.DATABASE_USER ?? "keo_the_thao",
      password: process.env.DATABASE_PASSWORD ?? "keo_the_thao",
      database: process.env.DATABASE_NAME ?? "keo_the_thao",
    };
    const admin = new Client(connection);
    await admin.connect();
    let server;
    let db;
    t.after(async () => {
      if (server && server.exitCode === null) {
        const exited = once(server, "exit");
        server.kill();
        await exited;
      }
      if (db?.isInitialized) await db.destroy();
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.end();
    });
    await admin.query(`CREATE DATABASE "${database}"`);
    db = new DataSource({
      type: "postgres",
      host: connection.host,
      port: connection.port,
      username: connection.user,
      password: connection.password,
      database,
      entities: [path.join(apiRoot, "dist/**/*.entity.js")],
      migrations: [path.join(apiRoot, "dist/database/migrations/*.js")],
    });
    await db.initialize();
    await db.runMigrations();
    const schema = await db.driver.createSchemaBuilder().log();
    assert.equal(
      schema.upQueries.length,
      0,
      "Entities and migrations must describe the same schema",
    );
    const listener = net.createServer();
    listener.listen(0, "127.0.0.1");
    await once(listener, "listening");
    const port = listener.address().port;
    listener.close();
    await once(listener, "close");
    let logs = "";
    server = spawn(process.execPath, ["dist/main.js"], {
      cwd: apiRoot,
      env: {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_NAME: database,
        JWT_SECRET: randomBytes(48).toString("hex"),
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout.on("data", (chunk) => {
      logs = (logs + chunk.toString()).slice(-8000);
    });
    server.stderr.on("data", (chunk) => {
      logs = (logs + chunk.toString()).slice(-8000);
    });
    const base = `http://127.0.0.1:${port}/api`;
    let ready = false;
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(`${base}/health`)).ok) {
          ready = true;
          break;
        }
      } catch {}
      if (server.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, `API failed to start: ${logs}`);
    async function request(
      route,
      { cookie, method = "GET", body, headers = {} } = {},
    ) {
      const response = await fetch(`${base}${route}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-KT-Client": "web",
          ...(cookie ? { Cookie: cookie } : {}),
          ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return {
        status: response.status,
        data: await response.json(),
        cookie: response.headers.get("set-cookie")?.split(";")[0],
        cookieHeader: response.headers.get("set-cookie"),
      };
    }
    async function register(email, name) {
      const result = await request("/auth/register", {
        method: "POST",
        body: { email, name, password: "TestTeam2026!" },
      });
      assert.equal(result.status, 201, JSON.stringify(result.data));
      return result;
    }
    const host = await register("HOST@example.com", "Chủ kèo");
    const a = await register("a@example.com", "Người chơi A");
    const b = await register("b@example.com", "Người chơi B");
    const c = await register("c@example.com", "Người chơi C");
    const d = await register("d@example.com", "Người chơi D");
    let match;
    const matchBody = (overrides) => ({
      title: "Giao lưu bóng đá cuối tuần",
      sport: "football",
      level: "all",
      city: "TP. Hồ Chí Minh",
      district: "Bình Thạnh",
      venue: "Sân kiểm thử",
      address: "12 Nguyễn Văn A",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 90,
      capacity: 3,
      fee: 60000,
      description: "Đến trước 10 phút.",
      positions: [],
      ...overrides,
    });
    const editBody = (item) => {
      const {
        title,
        level,
        city,
        district,
        venue,
        address,
        startsAt,
        durationMinutes,
        fee,
        description,
      } = item;
      return {
        title,
        level,
        city,
        district,
        venue,
        address,
        startsAt,
        durationMinutes,
        fee,
        description,
      };
    };

    await t.test(
      "registration/login, private profile and CSRF protection",
      async () => {
        assert.equal(host.data.email, "host@example.com");
        assert.equal("passwordHash" in host.data, false);
        assert.match(host.cookieHeader, /HttpOnly/);
        assert.match(host.cookieHeader, /SameSite=Lax/);
        assert.equal(
          (
            await request("/auth/register", {
              method: "POST",
              body: {
                email: "host@example.com",
                name: "Trùng",
                password: "TestTeam2026!",
              },
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request("/auth/login", {
              method: "POST",
              body: { email: "host@example.com", password: "wrong-password" },
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await request("/auth/login", {
              method: "POST",
              body: { email: "host@example.com", password: "TestTeam2026!" },
            })
          ).status,
          200,
        );
        assert.equal((await request("/auth/me")).status, 401);
        assert.equal(
          (await request("/auth/me", { cookie: "kt_session=forged" })).status,
          401,
        );
        assert.equal(
          (await request("/auth/me", { cookie: a.cookie })).data.name,
          "Người chơi A",
        );
        const profile = await request("/auth/me", {
          method: "PATCH",
          cookie: a.cookie,
          body: {
            name: "Cầu thủ A",
            city: "Hà Nội",
            bio: "Thủ môn",
            sports: ["football"],
          },
        });
        assert.equal(profile.status, 200);
        assert.equal(
          (
            await request("/auth/logout", {
              method: "POST",
              headers: { "X-KT-Client": "" },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await request("/auth/logout", {
              method: "POST",
              headers: { Origin: "https://evil.invalid" },
            })
          ).status,
          403,
        );
        assert.match(
          (await request("/auth/logout", { method: "POST", cookie: b.cookie }))
            .cookieHeader,
          /Expires=Thu, 01 Jan 1970/,
        );
      },
    );
    await t.test(
      "create validates dates, limits and permissions; discovery supports filters and pagination",
      async () => {
        assert.equal(
          (await request("/matches", { method: "POST", body: matchBody({}) }))
            .status,
          401,
        );
        assert.equal(
          (
            await request("/matches", {
              method: "POST",
              cookie: host.cookie,
              body: matchBody({ startsAt: "2000-01-01T00:00:00Z" }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/matches", {
              method: "POST",
              cookie: host.cookie,
              body: matchBody({
                capacity: 2,
                positions: [{ name: "Thủ môn", quantity: 2 }],
              }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/matches", {
              method: "POST",
              cookie: host.cookie,
              body: matchBody({ extraField: true }),
            })
          ).status,
          400,
        );
        const created = await request("/matches", {
          method: "POST",
          cookie: host.cookie,
          body: matchBody({}),
        });
        assert.equal(created.status, 201, JSON.stringify(created.data));
        match = created.data;
        assert.equal(match.playerCount, 1);
        assert.equal(match.spotsLeft, 2);
        assert.equal("email" in match.host, false);
        assert.equal("passwordHash" in match.host, false);
        const found = await request(
          "/matches?sport=football&q=cu%E1%BB%91i&city=TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh&limit=1",
        );
        assert.equal(found.status, 200);
        assert.equal(found.data.total, 1);
        assert.equal(found.data.items.length, 1);
        assert.equal((await request("/matches?sport=tennis")).data.total, 0);
        assert.equal((await request("/matches?q=%25")).data.total, 0);
        assert.equal((await request("/matches?limit=1000")).status, 400);
        assert.equal((await request("/matches/not-a-uuid")).status, 400);
        assert.equal((await request(`/matches/${randomUUID()}`)).status, 404);
      },
    );
    await t.test(
      "join, host-only approval, reject, resubmit, withdraw and edit are persisted",
      async () => {
        assert.equal(
          (
            await request(`/matches/${match.id}/requests`, {
              method: "POST",
              cookie: host.cookie,
              body: {},
            })
          ).status,
          400,
        );
        const joined = await request(`/matches/${match.id}/requests`, {
          method: "POST",
          cookie: a.cookie,
          body: { message: "Cho mình một suất!" },
        });
        assert.equal(joined.status, 201);
        assert.equal(joined.data.status, "pending");
        assert.equal(
          (
            await request(`/matches/${match.id}/requests`, {
              method: "POST",
              cookie: a.cookie,
              body: {},
            })
          ).status,
          409,
        );
        assert.equal(
          (await request(`/matches/${match.id}/requests`, { cookie: b.cookie }))
            .status,
          403,
        );
        assert.equal(
          (
            await request(`/matches/${match.id}/requests/${joined.data.id}`, {
              method: "PATCH",
              cookie: b.cookie,
              body: { status: "accepted" },
            })
          ).status,
          403,
        );
        const pending = await request(`/matches/${match.id}/requests`, {
          cookie: host.cookie,
        });
        assert.equal(pending.data.length, 1);
        assert.equal(pending.data[0].message, "Cho mình một suất!");
        assert.equal("email" in pending.data[0].user, false);
        assert.equal(
          (
            await request(`/matches/${match.id}/requests/${joined.data.id}`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "rejected" },
            })
          ).status,
          200,
        );
        const again = await request(`/matches/${match.id}/requests`, {
          method: "POST",
          cookie: a.cookie,
          body: {},
        });
        assert.equal(again.data.id, joined.data.id);
        assert.equal(
          (
            await request(`/matches/${match.id}/requests/${joined.data.id}`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "accepted" },
            })
          ).status,
          200,
        );
        assert.equal(
          (await request(`/matches/${match.id}`)).data.playerCount,
          2,
        );
        assert.equal(
          (await request("/matches/mine", { cookie: a.cookie })).data
            .requests[0].status,
          "accepted",
        );
        assert.equal(
          (
            await request(`/matches/${match.id}/requests/me`, {
              method: "DELETE",
              cookie: a.cookie,
            })
          ).status,
          200,
        );
        assert.equal(
          (await request(`/matches/${match.id}`)).data.playerCount,
          1,
        );
        assert.equal(
          (
            await request(`/matches/${match.id}`, {
              method: "PATCH",
              cookie: b.cookie,
              body: editBody(match),
            })
          ).status,
          403,
        );
        const edited = await request(`/matches/${match.id}`, {
          method: "PATCH",
          cookie: host.cookie,
          body: { ...editBody(match), title: "Đổi tên kèo giao lưu" },
        });
        assert.equal(edited.status, 200);
        assert.equal(edited.data.title, "Đổi tên kèo giao lưu");
      },
    );
    await t.test(
      "simultaneous approvals never overbook the last spot",
      async () => {
        const game = (
          await request("/matches", {
            method: "POST",
            cookie: host.cookie,
            body: matchBody({ capacity: 2 }),
          })
        ).data;
        const requests = await Promise.all(
          [a, b].map((u) =>
            request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: u.cookie,
              body: {},
            }),
          ),
        );
        assert.ok(requests.every((r) => r.status === 201));
        const approvals = await Promise.all(
          requests.map((r) =>
            request(`/matches/${game.id}/requests/${r.data.id}`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "accepted" },
            }),
          ),
        );
        assert.deepEqual(approvals.map((r) => r.status).sort(), [200, 409]);
        const final = (await request(`/matches/${game.id}`)).data;
        assert.equal(final.playerCount, 2);
        assert.equal(final.spotsLeft, 0);
        assert.equal(
          (
            await request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: c.cookie,
              body: {},
            })
          ).status,
          409,
        );
        const available = (await request("/matches?available=true")).data.items;
        assert.equal(
          available.some((m) => m.id === game.id),
          false,
        );
      },
    );
    await t.test(
      "position quotas and reserved general slots cannot be bypassed",
      async () => {
        const game = (
          await request("/matches", {
            method: "POST",
            cookie: host.cookie,
            body: matchBody({
              capacity: 4,
              positions: [
                { name: "Thủ môn", quantity: 1 },
                { name: "Tiền đạo", quantity: 1 },
              ],
            }),
          })
        ).data;
        const goalie = game.positions.find((p) => p.name === "Thủ môn").id;
        assert.equal(
          (
            await request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: d.cookie,
              body: { positionId: randomUUID() },
            })
          ).status,
          400,
        );
        const joins = await Promise.all(
          [a, b].map((u) =>
            request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: u.cookie,
              body: { positionId: goalie },
            }),
          ),
        );
        const decisions = await Promise.all(
          joins.map((r) =>
            request(`/matches/${game.id}/requests/${r.data.id}`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "accepted" },
            }),
          ),
        );
        assert.deepEqual(decisions.map((r) => r.status).sort(), [200, 409]);
        const general = await request(`/matches/${game.id}/requests`, {
          method: "POST",
          cookie: c.cookie,
          body: {},
        });
        assert.equal(
          (
            await request(`/matches/${game.id}/requests/${general.data.id}`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "accepted" },
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: d.cookie,
              body: {},
            })
          ).status,
          409,
        );
        const filled = (await request(`/matches/${game.id}`)).data;
        assert.equal(filled.playerCount, 3);
        assert.equal(filled.positions.find((p) => p.id === goalie).filled, 1);
        const pendingId =
          joins[decisions.findIndex((r) => r.status === 409)].data.id;
        assert.equal(
          (
            await request(`/matches/${game.id}/status`, {
              method: "PATCH",
              cookie: b.cookie,
              body: { status: "cancelled" },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await request(`/matches/${game.id}/status`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "completed" },
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request(`/matches/${game.id}/status`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "cancelled" },
            })
          ).status,
          200,
        );
        const requests = (
          await request(`/matches/${game.id}/requests`, { cookie: host.cookie })
        ).data;
        assert.equal(
          requests.find((r) => r.id === pendingId).status,
          "cancelled",
        );
        assert.equal(
          (
            await request(`/matches/${game.id}/requests`, {
              method: "POST",
              cookie: d.cookie,
              body: {},
            })
          ).status,
          409,
        );
        assert.equal(
          (await request("/matches")).data.items.some((m) => m.id === game.id),
          false,
        );
      },
    );
    await t.test(
      "started matches reject new joins; hosts can mark them completed",
      async () => {
        await db.query(
          "UPDATE matches SET \"startsAt\" = now() - interval '1 minute' WHERE id = $1",
          [match.id],
        );
        assert.equal(
          (
            await request(`/matches/${match.id}/requests`, {
              method: "POST",
              cookie: c.cookie,
              body: {},
            })
          ).status,
          409,
        );
        assert.equal(
          (
            await request(`/matches/${match.id}/status`, {
              method: "PATCH",
              cookie: host.cookie,
              body: { status: "completed" },
            })
          ).status,
          200,
        );
        assert.equal(
          (await request(`/matches/${match.id}`)).data.status,
          "completed",
        );
      },
    );
    await t.test(
      "login throttling also covers route casing and trailing slashes",
      async () => {
        const options = {
          method: "POST",
          body: { email: "host@example.com", password: "wrong-password" },
        };
        assert.equal((await request("/AUTH/login/", options)).status, 401);
        let last;
        for (let i = 0; i < 31; i++)
          last = await request("/AUTH/login/", options);
        assert.equal(last.status, 429);
      },
    );
    await t.test(
      "migrations can be reverted and reapplied in the isolated test database",
      async () => {
        for (let i = 0; i < db.migrations.length; i++)
          await db.undoLastMigration();
        assert.equal(
          (await db.query("SELECT to_regclass('public.users') AS table"))[0]
            .table,
          null,
        );
        await db.runMigrations();
        assert.equal(
          (await db.query("SELECT count(*)::int AS total FROM users"))[0].total,
          0,
        );
      },
    );
  },
);
