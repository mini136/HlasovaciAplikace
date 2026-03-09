#!/usr/bin/env node
// ---------------------------------------------------------------------------
// GA Browser Anomaly Simulator – multithreaded, worldwide geolocation
// Uses Node worker_threads + Playwright to saturate all CPU cores.
// ---------------------------------------------------------------------------
import {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} from "node:worker_threads";
import { cpus } from "node:os";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

// ---- data tables shared by all workers ------------------------------------

const USER_AGENTS = [
  // Desktop – Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  // Desktop – macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  // Desktop – Linux
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0",
  // Mobile – Android
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.99 Mobile Safari/537.36",
  // Mobile – iOS
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  // Bot-like
  "curl/8.7.1",
  "Wget/1.21.4",
  "python-requests/2.31.0",
  "Go-http-client/2.0",
  "Googlebot/2.1 (+http://www.google.com/bot.html)",
];

const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
  { width: 412, height: 915 },
  { width: 375, height: 812 },
  { width: 360, height: 640 },
  { width: 320, height: 568 },
  { width: 768, height: 1024 },
  // weird / suspicious
  { width: 9999, height: 400 },
  { width: 200, height: 3000 },
  { width: 1, height: 1 },
];

const GEOLOCATIONS = [
  // Europe
  {
    latitude: 50.0755,
    longitude: 14.4378,
    label: "Prague, CZ",
    locale: "cs-CZ",
    tz: "Europe/Prague",
  },
  {
    latitude: 48.8566,
    longitude: 2.3522,
    label: "Paris, FR",
    locale: "fr-FR",
    tz: "Europe/Paris",
  },
  {
    latitude: 51.5074,
    longitude: -0.1278,
    label: "London, UK",
    locale: "en-GB",
    tz: "Europe/London",
  },
  {
    latitude: 52.52,
    longitude: 13.405,
    label: "Berlin, DE",
    locale: "de-DE",
    tz: "Europe/Berlin",
  },
  {
    latitude: 41.9028,
    longitude: 12.4964,
    label: "Rome, IT",
    locale: "it-IT",
    tz: "Europe/Rome",
  },
  {
    latitude: 40.4168,
    longitude: -3.7038,
    label: "Madrid, ES",
    locale: "es-ES",
    tz: "Europe/Madrid",
  },
  {
    latitude: 59.3293,
    longitude: 18.0686,
    label: "Stockholm, SE",
    locale: "sv-SE",
    tz: "Europe/Stockholm",
  },
  {
    latitude: 55.7558,
    longitude: 37.6173,
    label: "Moscow, RU",
    locale: "ru-RU",
    tz: "Europe/Moscow",
  },
  // North America
  {
    latitude: 40.7128,
    longitude: -74.006,
    label: "New York, US",
    locale: "en-US",
    tz: "America/New_York",
  },
  {
    latitude: 34.0522,
    longitude: -118.2437,
    label: "Los Angeles, US",
    locale: "en-US",
    tz: "America/Los_Angeles",
  },
  {
    latitude: 41.8781,
    longitude: -87.6298,
    label: "Chicago, US",
    locale: "en-US",
    tz: "America/Chicago",
  },
  {
    latitude: 25.7617,
    longitude: -80.1918,
    label: "Miami, US",
    locale: "en-US",
    tz: "America/New_York",
  },
  {
    latitude: 45.5017,
    longitude: -73.5673,
    label: "Montreal, CA",
    locale: "fr-CA",
    tz: "America/Montreal",
  },
  {
    latitude: 19.4326,
    longitude: -99.1332,
    label: "Mexico City, MX",
    locale: "es-MX",
    tz: "America/Mexico_City",
  },
  // South America
  {
    latitude: -23.5505,
    longitude: -46.6333,
    label: "São Paulo, BR",
    locale: "pt-BR",
    tz: "America/Sao_Paulo",
  },
  {
    latitude: -34.6037,
    longitude: -58.3816,
    label: "Buenos Aires, AR",
    locale: "es-AR",
    tz: "America/Argentina/Buenos_Aires",
  },
  {
    latitude: 4.711,
    longitude: -74.0721,
    label: "Bogotá, CO",
    locale: "es-CO",
    tz: "America/Bogota",
  },
  // Asia
  {
    latitude: 35.6762,
    longitude: 139.6503,
    label: "Tokyo, JP",
    locale: "ja-JP",
    tz: "Asia/Tokyo",
  },
  {
    latitude: 31.2304,
    longitude: 121.4737,
    label: "Shanghai, CN",
    locale: "zh-CN",
    tz: "Asia/Shanghai",
  },
  {
    latitude: 28.6139,
    longitude: 77.209,
    label: "New Delhi, IN",
    locale: "hi-IN",
    tz: "Asia/Kolkata",
  },
  {
    latitude: 37.5665,
    longitude: 126.978,
    label: "Seoul, KR",
    locale: "ko-KR",
    tz: "Asia/Seoul",
  },
  {
    latitude: 1.3521,
    longitude: 103.8198,
    label: "Singapore, SG",
    locale: "en-SG",
    tz: "Asia/Singapore",
  },
  {
    latitude: 25.2048,
    longitude: 55.2708,
    label: "Dubai, AE",
    locale: "ar-AE",
    tz: "Asia/Dubai",
  },
  {
    latitude: 13.7563,
    longitude: 100.5018,
    label: "Bangkok, TH",
    locale: "th-TH",
    tz: "Asia/Bangkok",
  },
  // Africa
  {
    latitude: -33.9249,
    longitude: 18.4241,
    label: "Cape Town, ZA",
    locale: "en-ZA",
    tz: "Africa/Johannesburg",
  },
  {
    latitude: 30.0444,
    longitude: 31.2357,
    label: "Cairo, EG",
    locale: "ar-EG",
    tz: "Africa/Cairo",
  },
  {
    latitude: 6.5244,
    longitude: 3.3792,
    label: "Lagos, NG",
    locale: "en-NG",
    tz: "Africa/Lagos",
  },
  // Oceania
  {
    latitude: -33.8688,
    longitude: 151.2093,
    label: "Sydney, AU",
    locale: "en-AU",
    tz: "Australia/Sydney",
  },
  {
    latitude: -36.8485,
    longitude: 174.7633,
    label: "Auckland, NZ",
    locale: "en-NZ",
    tz: "Pacific/Auckland",
  },
];

// ---- helpers --------------------------------------------------------------

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOf(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function loadProxiesFromFile(filePath) {
  if (!filePath) {
    const scriptDir = resolve(fileURLToPath(import.meta.url), "..");
    const defaultPath = resolve(scriptDir, "proxies.txt");
    if (existsSync(defaultPath)) filePath = defaultPath;
    else return [];
  }
  if (!existsSync(filePath)) return [];
  const lines = readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  return lines.map((line) => {
    const parts = line.split(":");
    if (parts.length >= 4) {
      return {
        server: `http://${parts[0]}:${parts[1]}`,
        username: parts[2],
        password: parts[3],
      };
    }
    return { server: `http://${parts[0]}:${parts[1]}` };
  });
}

async function fetchFreeProxies(targetUrl) {
  console.log("Fetching free proxy lists from public APIs...");

  const sources = [
    {
      name: "proxyscrape-http",
      url: "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=all",
    },
    {
      name: "proxyscrape-socks5",
      url: "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=5000&country=all",
    },
    {
      name: "TheSpeedX-http",
      url: "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
    },
    {
      name: "TheSpeedX-socks5",
      url: "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt",
    },
    {
      name: "monosans-http",
      url: "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
    },
    {
      name: "monosans-socks5",
      url: "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies_anonymous/socks5.txt",
    },
  ];

  const allRaw = [];
  for (const src of sources) {
    try {
      const resp = await fetch(src.url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) continue;
      const text = await resp.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(l));
      const protocol = src.name.includes("socks5") ? "socks5" : "http";
      for (const line of lines) {
        allRaw.push({ server: `${protocol}://${line}`, source: src.name });
      }
      console.log(`  ${src.name}: ${lines.length} proxies`);
    } catch {
      console.log(`  ${src.name}: failed to fetch`);
    }
  }

  if (allRaw.length === 0) {
    console.log("No proxies fetched from any source.");
    return [];
  }

  // Deduplicate
  const seen = new Set();
  const unique = allRaw.filter((p) => {
    if (seen.has(p.server)) return false;
    seen.add(p.server);
    return true;
  });

  // Shuffle and pick a larger sample — free proxies have high failure rate
  const shuffled = unique.sort(() => Math.random() - 0.5);
  const testBatch = shuffled.slice(0, Math.min(200, shuffled.length));

  console.log(
    `Unique proxies: ${unique.length}. Testing ${testBatch.length} for reachability...`,
  );

  // Test proxies by making a real request through them to the target
  const working = [];
  const testPromises = testBatch.map(async (proxy) => {
    try {
      const { chromium } = await import("playwright");
      const browser = await chromium.launch({
        headless: true,
        proxy: { server: proxy.server },
      });
      const page = await browser.newPage();
      const resp = await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      const status = resp?.status() ?? 0;
      await browser.close();
      if (status >= 200 && status < 400) {
        working.push(proxy);
      }
    } catch {
      // proxy didn't work, skip
    }
  });

  // Run tests with limited concurrency (10 at a time — faster validation)
  const concurrency = 10;
  for (let i = 0; i < testPromises.length; i += concurrency) {
    await Promise.all(testPromises.slice(i, i + concurrency));
    const tested = Math.min(i + concurrency, testPromises.length);
    process.stdout.write(
      `\r  Tested ${tested}/${testBatch.length}, working so far: ${working.length}`,
    );
  }
  console.log("");

  console.log(`Working proxies found: ${working.length}`);
  return working;
}

async function loadProxies(filePath, targetUrl) {
  // First try file-based proxies
  const fromFile = loadProxiesFromFile(filePath);
  if (fromFile.length > 0) {
    console.log(`Loaded ${fromFile.length} proxies from file.`);
    return fromFile;
  }

  // Auto-fetch free proxies
  return await fetchFreeProxies(targetUrl);
}

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((entry) => {
      const [k, v] = entry.replace(/^--/, "").split("=");
      return [k, v ?? "true"];
    }),
  );

  const numCpus = cpus().length;

  return {
    url: new URL(args.url ?? "http://46.13.167.200:40160/").toString(),
    sessions: Number(args.sessions ?? 200),
    workers: Number(args.workers ?? numCpus),
    tabsPerWorker: Number(args.tabs ?? 6),
    minStayMs: Number(args.minStayMs ?? 800),
    maxStayMs: Number(args.maxStayMs ?? 3000),
    minGapMs: Number(args.minGapMs ?? 10),
    maxGapMs: Number(args.maxGapMs ?? 120),
    headless: args.headless !== "false",
    proxyFile: args.proxyFile ?? null,
  };
}

// ---- worker thread code ---------------------------------------------------

async function workerMain() {
  const cfg = workerData;
  const proxies = cfg.proxies ?? [];
  const { chromium } = await import("playwright");

  // If we have proxies, we launch a browser per-session (different proxy each time).
  // If no proxies, share one browser for speed.
  const sharedBrowser =
    proxies.length === 0
      ? await chromium.launch({ headless: cfg.headless })
      : null;

  let ok = 0;
  let fail = 0;

  async function tabLoop() {
    while (true) {
      const idx = Atomics.add(cfg.counter, 0, 1);
      if (idx >= cfg.sessions) return;

      const sessionId = idx + 1;
      const ua = randomOf(USER_AGENTS);
      const viewport = randomOf(VIEWPORTS);
      const geo = randomOf(GEOLOCATIONS);

      const maxRetries = proxies.length > 0 ? 3 : 1;
      let succeeded = false;

      for (let attempt = 0; attempt < maxRetries && !succeeded; attempt++) {
        const proxy = proxies.length > 0 ? randomOf(proxies) : null;
        let browser = sharedBrowser;

        try {
          if (proxy) {
            const launchOpts = {
              headless: cfg.headless,
              proxy: { server: proxy.server },
            };
            if (proxy.username) {
              launchOpts.proxy.username = proxy.username;
              launchOpts.proxy.password = proxy.password;
            }
            browser = await chromium.launch(launchOpts);
          }

          const context = await browser.newContext({
            userAgent: ua,
            viewport,
            locale: geo.locale,
            timezoneId: geo.tz,
            geolocation: { latitude: geo.latitude, longitude: geo.longitude },
            permissions: ["geolocation"],
            extraHTTPHeaders: {
              "Accept-Language": `${geo.locale},en;q=0.5`,
              "X-Simulated-Client": "ga-browser-sim-mt",
            },
          });

          const page = await context.newPage();
          const startedAt = Date.now();
          const response = await page.goto(cfg.url, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });

          // simulate human-ish interaction
          await page.mouse.move(
            randInt(10, Math.max(10, viewport.width - 10)),
            randInt(10, Math.max(10, viewport.height - 10)),
          );
          await page.mouse.wheel(0, randInt(100, 900));

          if (Math.random() > 0.4) {
            await page.mouse.click(
              randInt(50, Math.max(50, viewport.width - 50)),
              randInt(50, Math.max(50, viewport.height - 50)),
            );
          }

          const stayMs = randInt(cfg.minStayMs, cfg.maxStayMs);
          await sleep(stayMs);

          const navMs = Date.now() - startedAt;
          const status = response?.status() ?? 0;
          ok += 1;
          succeeded = true;

          parentPort?.postMessage({
            type: "ok",
            sessionId,
            status,
            navMs,
            stayMs,
            geo: geo.label,
            vp: `${viewport.width}x${viewport.height}`,
            proxy: proxy ? proxy.server : "direct",
          });

          await context.close();
          if (proxy && browser !== sharedBrowser) await browser.close();
        } catch (error) {
          if (proxy && browser && browser !== sharedBrowser) {
            try {
              await browser.close();
            } catch {}
          }
          if (attempt === maxRetries - 1) {
            fail += 1;
            parentPort?.postMessage({
              type: "fail",
              sessionId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
          // else retry with a different proxy
        }
      }

      await sleep(randInt(cfg.minGapMs, cfg.maxGapMs));
    }
  }

  const tabs = Array.from({ length: cfg.tabsPerWorker }, () => tabLoop());
  await Promise.all(tabs);
  if (sharedBrowser) await sharedBrowser.close();

  parentPort?.postMessage({ type: "done", ok, fail });
}

// ---- main thread ----------------------------------------------------------

async function main() {
  if (!isMainThread) {
    await workerMain();
    return;
  }

  const cfg = parseArgs();
  const proxies = await loadProxies(cfg.proxyFile, cfg.url);

  console.log("=== GA Browser Anomaly Simulator (multithreaded) ===");
  console.log(`Target   : ${cfg.url}`);
  console.log(`Sessions : ${cfg.sessions}`);
  console.log(`Workers  : ${cfg.workers} (CPU cores: ${cpus().length})`);
  console.log(`Tabs/wkr : ${cfg.tabsPerWorker}`);
  console.log(
    `Effective concurrency: ${cfg.workers * cfg.tabsPerWorker} browser tabs`,
  );
  console.log(`Geo pool : ${GEOLOCATIONS.length} cities worldwide`);
  console.log(
    `Proxies  : ${proxies.length > 0 ? proxies.length + " loaded" : "none (all traffic from your IP)"}`,
  );
  console.log(`Stay     : ${cfg.minStayMs}-${cfg.maxStayMs} ms`);
  console.log(`Headless : ${cfg.headless}`);
  if (proxies.length === 0) {
    console.log("");
    console.log(
      "NOTE: GA determines location by IP address, not browser geolocation.",
    );
    console.log("      All sessions will appear from YOUR city in GA.");
    console.log("      Add proxies to proxies.txt for worldwide IP diversity.");
  }
  console.log("");

  // Shared counter via SharedArrayBuffer (atomic cross-thread session index)
  const sab = new SharedArrayBuffer(4);
  const counter = new Int32Array(sab);

  const summary = { ok: 0, fail: 0, workersDone: 0 };

  const workers = [];
  for (let i = 0; i < cfg.workers; i += 1) {
    const w = new Worker(new URL(import.meta.url), {
      workerData: { ...cfg, counter, proxies },
    });

    w.on("message", (msg) => {
      if (msg.type === "ok") {
        summary.ok += 1;
        const total = summary.ok + summary.fail;
        if (total % 10 === 0 || total <= 5) {
          const via = msg.proxy !== "direct" ? ` via ${msg.proxy}` : "";
          console.log(
            `[${total}/${cfg.sessions}] S${msg.sessionId} ${msg.geo} status=${msg.status} nav=${msg.navMs}ms stay=${msg.stayMs}ms vp=${msg.vp}${via}`,
          );
        }
      } else if (msg.type === "fail") {
        summary.fail += 1;
        console.log(`[FAIL] S${msg.sessionId} ${msg.error}`);
      } else if (msg.type === "done") {
        summary.workersDone += 1;
        if (summary.workersDone === cfg.workers) {
          console.log("");
          console.log("=== Simulation finished ===");
          console.log(`Total OK : ${summary.ok}`);
          console.log(`Total FAIL: ${summary.fail}`);
        }
      }
    });

    w.on("error", (err) => {
      console.error(`[Worker ${i + 1} error] ${err.message}`);
    });

    workers.push(w);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
