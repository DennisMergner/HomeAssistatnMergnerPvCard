import { build } from "esbuild";
import { context } from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: ["src/mergner-pv-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: "mergner-pv-card.js",
  minify: !watch,
  sourcemap: watch,
  legalComments: "none"
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(options);
  console.log("Build complete: mergner-pv-card.js");
}
