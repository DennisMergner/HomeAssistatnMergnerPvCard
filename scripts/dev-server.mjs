import { context } from "esbuild";

const host = process.env.DEV_HOST || "0.0.0.0";
const port = Number(process.env.DEV_PORT || 4173);

const ctx = await context({
  entryPoints: ["src/mergner-pv-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: "mergner-pv-card.js",
  sourcemap: true,
  legalComments: "none",
  minify: false
});

await ctx.watch();
const server = await ctx.serve({
  servedir: ".",
  host,
  port
});

  console.log(`Dev server running on http://${host}:${server.port}/mergner-pv-card.js`);
console.log("Use this URL as Lovelace resource during design phase.");
