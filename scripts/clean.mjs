import { rm } from "node:fs/promises";
for (const path of ["dist", "coverage", "target", "src-tauri/target"])
  await rm(path, { recursive: true, force: true });
