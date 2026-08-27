// verify-peers.mjs — host version contract
//
// DSH 0.1.1-rc.* is the current published line (npm latest/next = 0.1.1-rc.2).
// node-semver only lets a prerelease satisfy a range when some comparator
// shares that exact major.minor.patch tuple *and* itself carries a prerelease
// tag. A range like `>=0.1.0-rc.6` therefore matches 0.1.0-rc.* and 0.1.1
// (stable) but silently excludes 0.1.1-rc.2. awesome-dsh-plugin contributing
// requires an explicit `|| >=0.1.1-rc.1 <0.2.0-0` branch.
//
// Official Node floor (deepseek-harness root engines at dsh-v0.1.1-rc.2):
// `^22.19.0 || >=24.0.0`. Host Cordis is `@deepseek-ai/cordis`, not `cordis`.

import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const NODE_ENGINE = "^22.19.0 || >=24.0.0";
const CORDIS = "^4.0.1";
const LOCALE = ">=0.1.0-rc.6 <0.1.1 || >=0.1.1-rc.1 <0.2.0-0";
const LLM = ">=0.1.0-rc.2 <0.1.1 || >=0.1.1-rc.1 <0.2.0-0";

let failures = 0;
const ok = (cond, name, detail = "") => {
  if (cond) console.log("PASS " + name);
  else {
    failures++;
    console.log("FAIL " + name + (detail ? ": " + detail : ""));
  }
};

ok(pkg.engines?.node === NODE_ENGINE, "engines.node", JSON.stringify(pkg.engines));
ok(!pkg.peerDependencies?.cordis, "no unscoped cordis peer", JSON.stringify(pkg.peerDependencies?.cordis));
ok(pkg.peerDependencies?.["@deepseek-ai/cordis"] === CORDIS, "@deepseek-ai/cordis", JSON.stringify(pkg.peerDependencies?.["@deepseek-ai/cordis"]));
ok(pkg.peerDependencies?.["@deepseek-ai/dsh-client-locale"] === LOCALE, "dsh-client-locale range", JSON.stringify(pkg.peerDependencies?.["@deepseek-ai/dsh-client-locale"]));
ok(pkg.peerDependencies?.["@deepseek-ai/dsh-llm"] === LLM, "dsh-llm range", JSON.stringify(pkg.peerDependencies?.["@deepseek-ai/dsh-llm"]));

const locale = pkg.peerDependencies?.["@deepseek-ai/dsh-client-locale"] ?? "";
const llm = pkg.peerDependencies?.["@deepseek-ai/dsh-llm"] ?? "";
ok(locale.includes(">=0.1.1-rc.1") && locale.includes("<0.2.0-0"), "locale range has 0.1.1-rc branch");
ok(llm.includes(">=0.1.1-rc.1") && llm.includes("<0.2.0-0"), "llm range has 0.1.1-rc branch");

console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
