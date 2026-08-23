import fs from "node:fs";
import path from "node:path";
import { locales } from "./locales.mjs";

const root = path.join(import.meta.dirname, "..");
const baselineDir = path.join(root, "src", "en");
const files = fs.readdirSync(baselineDir).filter((name) => name.endsWith(".json")).sort();
const placeholders = (value) => [...String(value).matchAll(/\{([\w.-]+)\}/g)].map((match) => match[1]).sort();
const load = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const fail = [];

// --- 英文殘留閘 ---
// 值同 src/en 逐字節相同，唔一定係缺譯：純佔位符字串、專有名詞、技術識別碼本來就要照留。
// 判準：剝走佔位符同技術詞之後，仲剩 >= ENGLISH_WORD_THRESHOLD 個英文字 => 當缺譯。
// 單字／短標籤（例如波蘭文 "Model"）唔會中，整句英文散文一定中。
const ENGLISH_WORD_THRESHOLD = 3;
const LITERAL_TERMS = /\b(?:DeepSeek Harness|DSH|JSON|YAML|YML|npm|pnpm|MCP|API|URL|URI|CLI|GUI|SDK|LLM|TTFT|GPU|CPU|RAM|ZIP|PNG|JPG|JPEG|WebP|GIF|SVG|PDF|CSV|HTML|CSS|JS|TS|HTTP|HTTPS|SSH|OAuth|UUID|ID|IDs|Cordis|Electron|Node|TypeScript|JavaScript|Python|Markdown|Git|GitHub|GitLab|Docker|Linux|macOS|Windows|OK|tok\/s|str_replace_editor|Standard mode|PTC mode|Minimal mode|Creator mode|Code Mode SDK|Base URL)\b/g;
const englishWordCount = (value) => String(value)
  .replace(/\{[^{}]*\}/g, " ")        // 佔位符
  .replace(/\/[A-Za-z][\w-]*/g, " ")   // slash command，例如 /plan
  .replace(/[\w.-]+\.(?:ya?ml|json|mjs|cjs|js|ts|md|txt|log)\b/gi, " ") // 檔名
  .replace(LITERAL_TERMS, " ")
  .split(/[^A-Za-z']+/)
  .filter((word) => word.length >= 2).length;

// 注意：英文殘留閘只對「同 src/en 逐字節相同」嘅值生效。重寫過嘅英文散文（改咗
// 一兩個字）冇得可靠咁同其他拉丁系語言區分（法文/德文/西文詞一樣係拉丁字母），
// 所以唔強行偵測——呢個係已知限制，靠翻譯者自己唔好漏譯。

// --- 簡體殘留閘 ---
// 只查 traditional locale。chars.json 嘅 key 全部係簡體專用字（0 個 identity mapping），
// 所以精譯值入面出現任何一個 key 字，就係漏轉。注意：runtime 對「精譯命中」唔會再過轉換器
// （只有 fallback 先會），所以呢類殘留一定去到 UI，verify-converter.mjs 永遠查唔到。
const simplifiedChars = new Set(
  Object.keys(JSON.parse(fs.readFileSync(path.join(root, "src", "zh-tw-parts", "chars.json"), "utf8"))),
);
const simplifiedResidue = (value) => [...new Set([...String(value)].filter((char) => simplifiedChars.has(char)))];

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
        if (target[key] === value && englishWordCount(value) >= ENGLISH_WORD_THRESHOLD) {
          fail.push(`${locale.id}/${file} [${ns}.${key}]: untranslated English (${englishWordCount(value)} words)`);
        }
        if (locale.traditional) {
          const residue = simplifiedResidue(target[key]);
          if (residue.length) fail.push(`${locale.id}/${file} [${ns}.${key}]: simplified residue ${residue.join("")}`);
        }
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
