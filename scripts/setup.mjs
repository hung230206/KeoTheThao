import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const [example, destination] of [
  ["apps/api/.env.example", "apps/api/.env"],
  ["apps/web/.env.example", "apps/web/.env.local"],
]) {
  const target = resolve(root, destination);
  if (existsSync(target)) {
    console.log(`Kept existing ${destination}`);
    continue;
  }
  const content = readFileSync(resolve(root, example), "utf8").replace(
    "replace-with-a-random-secret-of-at-least-32-characters",
    randomBytes(48).toString("hex"),
  );
  writeFileSync(target, content);
  console.log(`Created ${destination}`);
}
