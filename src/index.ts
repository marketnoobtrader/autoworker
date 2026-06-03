#!/usr/bin/env node

import { run } from "./autoworker.js";
import { ask, fail } from "./utils.js";

run().catch(async (err) => {
  fail(err?.message ?? String(err));
  await ask("\n\nPress Enter to exit...");
  process.exit(1);
});
