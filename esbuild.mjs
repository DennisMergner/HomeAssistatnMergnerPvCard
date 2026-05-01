import { build } from "esbuild";
import { context } from "esbuild";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const cardVersion = String(packageJson.version ?? "0.0.0");

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/mergner-pv-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: "mergner-pv-card.js",
  minify: !watch,
  sourcemap: watch,
  legalComments: "none",
  define: {
    __MERGNER_PV_CARD_VERSION__: JSON.stringify(cardVersion)
  }
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(options);
  console.log("Build complete: mergner-pv-card.js");
}
