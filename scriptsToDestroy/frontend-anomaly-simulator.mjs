#!/usr/bin/env node
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { setTimeout as sleep } from "node:timers/promises";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "curl/8.7.1",
  "Wget/1.21.4",
];

const WEIRD_VIEWPORTS = [
  "320x200",
  "9999x400",
  "200x3000",
  "3840x1080",
  "512x512",
];

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((entry) => {
      const [k, v] = entry.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
  );

  const parsedUrl = new URL(args.url ?? "https://necomeco.pythonanywhere.com/");

  return {
    url: parsedUrl.toString(),
    threads: Number(args.threads ?? 8),
    requestsPerThread: Number(args.requests ?? 120),
    minDelayMs: Number(args.minDelay ?? 20),
    maxDelayMs: Number(args.maxDelay ?? 180),
    referer: args.referer ?? "https://www.google.com/",
  };
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function doRequest(targetUrl, referer) {
  const userAgent = USER_AGENTS[randInt(0, USER_AGENTS.length - 1)];
  const viewport = WEIRD_VIEWPORTS[randInt(0, WEIRD_VIEWPORTS.length - 1)];

  const headers = {
    "User-Agent": userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.7,cs;q=0.4",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: referer,
    DNT: Math.random() > 0.5 ? "1" : "0",
    "X-Forwarded-For": `${randInt(11, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
    "X-Simulated-Viewport": viewport,
    "X-Suspicious-Pattern":
      Math.random() > 0.7 ? "burst-bot-like" : "human-like",
  };

  const startedAt = Date.now();
  const response = await fetch(targetUrl, {
    method: "GET",
    headers,
    redirect: "follow",
  });

  const durationMs = Date.now() - startedAt;
  await response.arrayBuffer();

  return {
    status: response.status,
    durationMs,
    userAgent,
    viewport,
  };
}

async function workerMain() {
  const { id, url, requestsPerThread, minDelayMs, maxDelayMs, referer } =
    workerData;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < requestsPerThread; i += 1) {
    try {
      const result = await doRequest(url, referer);
      ok += 1;
      parentPort?.postMessage({
        type: "request-ok",
        id,
        index: i + 1,
        status: result.status,
        durationMs: result.durationMs,
        ua: result.userAgent,
        viewport: result.viewport,
      });
    } catch (error) {
      fail += 1;
      parentPort?.postMessage({
        type: "request-fail",
        id,
        index: i + 1,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(randInt(minDelayMs, maxDelayMs));
  }

  parentPort?.postMessage({ type: "done", id, ok, fail });
}

async function main() {
  if (!isMainThread) {
    await workerMain();
    return;
  }

  const cfg = parseArgs();
  const workers = [];
  const summary = { ok: 0, fail: 0, done: 0 };

  console.log(`Starting FE anomaly simulator -> ${cfg.url}`);
  console.log(
    `threads=${cfg.threads}, requests/thread=${cfg.requestsPerThread}, delay=${cfg.minDelayMs}-${cfg.maxDelayMs}ms`,
  );
  console.log(
    "Tip: ensure frontend is reachable on the given URL before running larger bursts.",
  );

  for (let i = 0; i < cfg.threads; i += 1) {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: {
        id: i + 1,
        ...cfg,
      },
    });

    worker.on("message", (msg) => {
      if (msg.type === "request-ok") {
        summary.ok += 1;
        if (msg.index % 20 === 0) {
          console.log(
            `[W${msg.id}] #${msg.index} status=${msg.status} ${msg.durationMs}ms viewport=${msg.viewport}`,
          );
        }
      } else if (msg.type === "request-fail") {
        summary.fail += 1;
        console.log(`[W${msg.id}] #${msg.index} FAIL ${msg.error}`);
      } else if (msg.type === "done") {
        summary.done += 1;
        console.log(`[W${msg.id}] done ok=${msg.ok} fail=${msg.fail}`);
      }

      if (summary.done === cfg.threads) {
        console.log("--- Simulation finished ---");
        console.log(`total ok=${summary.ok}, total fail=${summary.fail}`);
      }
    });

    worker.on("error", (err) => {
      summary.fail += 1;
      console.error(`[W${i + 1}] worker error:`, err.message);
    });

    workers.push(worker);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
