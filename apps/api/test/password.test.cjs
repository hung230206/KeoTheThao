const { test } = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword } = require("../dist/auth/password");

test("password hashes use a fresh salt and authenticate only the original password", async () => {
  const first = await hashPassword("a strong password");
  const second = await hashPassword("a strong password");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("a strong password", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(await verifyPassword("anything", ""), false);
  assert.equal(await verifyPassword("anything", "bad:hash"), false);
});
