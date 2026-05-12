import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const contractPath = path.join(repoRoot, "docs/public-surface-contract.json");
const distRoot = path.join(repoRoot, "apps/site/dist");

let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function routeToDistFile(route) {
  if (route === "/") {
    return path.join(distRoot, "index.html");
  }
  if (route.endsWith(".txt")) {
    return path.join(distRoot, route.replace(/^\//, ""));
  }
  return path.join(distRoot, route.replace(/^\//, ""), "index.html");
}

function routeToUrl(baseUrl, route) {
  const url = new URL(route, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  return url.toString();
}

function fetchText(url) {
  const client = url.startsWith("https:") ? https : http;
  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8")
        });
      });
    });
    request.on("error", reject);
    request.setTimeout(10000, () => {
      request.destroy(new Error(`Timed out fetching ${url}`));
    });
  });
}

function isHtmlRoute(route) {
  return route === "/" || !path.extname(route);
}

function verifyHtml(route, html) {
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    fail(`${route} is missing a <title>.`);
  }
  if (!/<main\s+id=["']main["']/i.test(html)) {
    fail(`${route} is missing <main id="main">.`);
  }
  for (const expected of ["How it works", "Use cases", "Security", "Roadmap", "Docs"]) {
    if (!html.includes(expected)) {
      fail(`${route} is missing primary nav text: ${expected}.`);
    }
  }
  for (const expected of ["FAQ", "Demo packs", "Pack format"]) {
    if (!html.includes(expected)) {
      fail(`${route} is missing footer/site link text: ${expected}.`);
    }
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf("--url");
  return {
    baseUrl: urlIndex >= 0 ? args[urlIndex + 1] : null
  };
}

if (!fs.existsSync(contractPath)) {
  fail("Missing docs/public-surface-contract.json.");
} else {
  const { baseUrl } = parseArgs();
  const contract = readJson(contractPath);
  const routes = [
    ...(contract.website?.routes ?? []),
    "/llms.txt",
    "/llms-full.txt",
    "/robots.txt"
  ];
  const uniqueRoutes = [...new Set(routes)];

  if (baseUrl) {
    for (const route of uniqueRoutes) {
      const url = routeToUrl(baseUrl, route);
      try {
        const response = await fetchText(url);
        if (response.statusCode < 200 || response.statusCode >= 300) {
          fail(`${route} returned HTTP ${response.statusCode} from ${url}.`);
          continue;
        }
        if (isHtmlRoute(route)) {
          verifyHtml(route, response.body);
        }
      } catch (error) {
        fail(`${route} could not be fetched from ${url}: ${error.message}`);
      }
    }
  } else {
    if (!fs.existsSync(distRoot)) {
      fail("Missing apps/site/dist. Run pnpm site:verify before site-routes verification.");
    } else {
      for (const route of uniqueRoutes) {
        const filePath = routeToDistFile(route);
        if (!fs.existsSync(filePath)) {
          fail(`${route} is missing built file ${path.relative(repoRoot, filePath)}.`);
          continue;
        }
        if (isHtmlRoute(route)) {
          verifyHtml(route, fs.readFileSync(filePath, "utf8"));
        }
      }
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("Contextarr site routes verified.");
}
