import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const bump = process.argv[2] ?? "patch";
const flags = new Set(process.argv.slice(3));

const noPush = flags.has("--no-push");
const skipBranchCheck = flags.has("--skip-branch-check");
const allowDirty = flags.has("--allow-dirty");
const dryRun = flags.has("--dry-run");
const allowed = new Set(["patch", "minor", "major", "prerelease"]);

if (!allowed.has(bump)) {
  console.error(`Invalid release bump type: ${bump}`);
  console.error("Allowed: patch, minor, major, prerelease");
  process.exit(1);
}

function run(cmd) {
  console.log(`> ${cmd}`);
  if (dryRun) {
    return;
  }
  execSync(cmd, { stdio: "inherit" });
}

function runOut(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function getBranchName() {
  try {
    return runOut("git symbolic-ref --short HEAD");
  } catch {
    return "main";
  }
}

const branch = getBranchName();
const status = runOut("git status --porcelain");

if (!skipBranchCheck && branch !== "main") {
  console.error(`Release must be created from main. Current branch: ${branch}`);
  process.exit(1);
}

if (!allowDirty && status.length > 0) {
  console.error("Working tree is not clean. Please commit or stash changes first.");
  process.exit(1);
}

run(`npm version ${bump} --no-git-tag-version`);

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
const tag = `v${version}`;

run("npm run build");
run("git add -A");
run(`git commit -m "chore(release): ${tag}"`);
run(`git tag ${tag}`);

if (!noPush) {
  run(`git push origin ${branch}`);
  run(`git push origin ${tag}`);
}

console.log("Release complete");
console.log(`Version: ${version}`);
console.log(`Tag: ${tag}`);
console.log(`Pushed: ${noPush ? "no" : "yes"}`);
console.log(`Dry run: ${dryRun ? "yes" : "no"}`);
