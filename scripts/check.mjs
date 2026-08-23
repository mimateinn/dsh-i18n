import fs from "node:fs";
import path from "node:path";
import { locales } from "./locales.mjs";

const root = path.join(import.meta.dirname, "..");
const baselineDir = path.join(root, "src", "en");
const files = fs.readdirSync(baselineDir).filter((name) => name.endsWith(".json")).sort();
const placeholders = (value) => [...String(value).matchAll(/\{([\w.-]+)\}/g)].map((match) => match[1]).sort();
const load = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const fail = [];

for (const locale of locales) {
  const dir = path.join(root, "src", locale.dir);
  if (!fs.existsSync(dir)) { fail.push(`${locale.id}: missing src/${locale.dir}`); continue; }
  const actualFiles = fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
  for (const file of files.filter((name) => !actualFiles.includes(name))) fail.push(`${locale.id}: missing file ${file}`);
  for (const file of actualFiles.filter((name) => !files.includes(name))) fail.push(`${locale.id}: stale file ${file}`);
  for (const file of files.filter((name) => actualFiles.includes(name))) {
    let base, translated;
    try { base = load(path.join(baselineDir, file)); translated = load(path.join(dir, file)); }
    catch (error) { fail.push(`${locale.id}/${file}: invalid JSON (${error.message})`); continue; }
    if (!Array.isArray(base.entries) || !Array.isArray(translated.entries)) { fail.push(`${locale.id}/${file}: invalid entries array`); continue; }
    if (translated.pkg !== base.pkg) fail.push(`${locale.id}/${file}: stale pkg metadata`);
    const baseNs = new Map(base.entries.map((entry) => [entry.ns, entry.dict]));
    const translatedNs = new Map(translated.entries.map((entry) => [entry.ns, entry.dict]));
    for (const ns of translatedNs.keys()) if (!baseNs.has(ns)) fail.push(`${locale.id}/${file}: stale namespace ${ns}`);
    for (const [ns, dict] of baseNs) {
      const target = translatedNs.get(ns);
      if (!target) { fail.push(`${locale.id}/${file}: missing namespace ${ns}`); continue; }
      for (const key of Object.keys(target)) if (!(key in dict)) fail.push(`${locale.id}/${file} [${ns}]: stale key ${key}`);
      for (const [key, value] of Object.entries(dict)) {
        if (!(key in target)) { fail.push(`${locale.id}/${file} [${ns}]: missing key ${key}`); continue; }
        if (typeof target[key] !== "string" || target[key].trim() === "") fail.push(`${locale.id}/${file} [${ns}.${key}]: empty value`);
        if (placeholders(target[key]).join("|") !== placeholders(value).join("|")) fail.push(`${locale.id}/${file} [${ns}.${key}]: placeholder mismatch`);
      }
    }
  }
}

if (fail.length) {
  console.error(fail.map((message) => `✗ ${message}`).join("\n"));
  console.error(`i18n check failed: ${fail.length} issue(s)`);
  process.exit(1);
}
console.log(`i18n check passed: ${locales.length} locales × ${files.length} files`);
