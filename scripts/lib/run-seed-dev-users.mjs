import { spawn } from "node:child_process";
import { resolve } from "node:path";

export function runSeedDevUsers() {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [resolve(process.cwd(), "scripts/seed-dev-users.mjs")], {
      stdio: "inherit",
      env: process.env,
    });

    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`seed-dev-users exited with code ${code ?? "unknown"}`));
    });
  });
}
