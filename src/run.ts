import { spawn } from "child_process";

function runProcess(command: string, args: string[], name: string) {
  const process = spawn(command, args);

  process.stdout.on("data", (data) => {
    console.log(`[${name}] ${data}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`[${name}] ${data}`);
  });

  process.on("close", (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });
}

// Run the server
runProcess("bun", ["src/index.ts"], "Server");

// Run the crawler
runProcess("bun", ["src/crawl.ts"], "Crawler");
