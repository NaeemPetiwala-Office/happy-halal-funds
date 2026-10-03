import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/** Privacy guard: fails if any analytics/tracking package or script domain sneaks into the app. */
const TRACKERS = [
  "google-analytics", "googletagmanager", "gtag(", "react-ga", "@analytics/", "segment", "mixpanel", "amplitude",
  "posthog", "hotjar", "fullstory", "@sentry", "logrocket", "plausible", "matomo", "clarity.ms", "facebook.net",
  "fbq(", "heap-analytics", "intercom", "datadog", "newrelic", "@vercel/analytics", "smartlook", "mouseflow",
];

const root = path.resolve(__dirname, "../..");
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css|html|json)$/.test(f) && !f.endsWith(".test.ts") ? [p] : [];
  });
}

describe("privacy", () => {
  it("package.json has no analytics or tracker dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(" ").toLowerCase();
    for (const t of TRACKERS) expect(deps, t).not.toContain(t);
  });
  it("app source and public files reference no tracker scripts", () => {
    const hits: string[] = [];
    for (const f of [...files(path.join(root, "src")), ...files(path.join(root, "public"))]) {
      if (f.endsWith("routeTree.gen.ts") || f.includes(`${path.sep}integrations${path.sep}`)) continue;
      const text = readFileSync(f, "utf8").toLowerCase();
      for (const t of TRACKERS) if (text.includes(t)) hits.push(`${path.relative(root, f)}: ${t}`);
    }
    expect(hits).toEqual([]);
  });
});
