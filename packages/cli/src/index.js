#!/usr/bin/env node

import { runCli } from "./cli.js";

runCli(process.argv.slice(2))
  .then((status) => {
    process.exitCode = status;
  })
  .catch((error) => {
    console.error(`zeron-ui: ${error.message}`);
    process.exitCode = 1;
  });
