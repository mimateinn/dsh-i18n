// extract.mjs — 从 DSH 各 client 包的 lib/client.js 中抽取全部 zh 语言字典，
// 输出为 src/zh-src/<pkg>.json（每文件 { pkg, entries: [{ ns, dict }] }）。
// 用法: node scripts/extract.mjs <node_modules_root>
// 字典形态（已实测）：
//   const NS = "xxx"; const zh = {...}; register(NS, {zh, en})
//   register(NS, { zh: {...}, en: {...} })
//   register(NS, "zh", {...})                          （permission-presets）
//   const dictionaries = [["zh", {...}], ["en", {...}]]（directory-picker-browse）
//   const zh = {...} 值内引用常量（PLAN_NEXT_ACTION_ZH / accessZh["k"] 等）
import fs from "node:fs";
import path from "node:path";

const installed = process.argv[2];
if (!installed) throw new Error("usage: node scripts/extract.mjs <installed DSH path>");
const candidates = [
  installed,
  path.join(installed, "node_modules", "@deepseek-ai"),
  path.join(installed, "resources", "app.asar.unpacked", "node_modules", "@deepseek-ai"),
];
const root = candidates.find((candidate) => fs.existsSync(path.join(candidate, "dsh-client-locale", "lib", "client.js")));
if (!root) throw new Error(`No installed DSH locale packages found under: ${path.resolve(installed)}`);

const PKGS = [
  "dsh-client-locale",
  "dsh-client-ui-cordis",
  "dsh-client-ui-permission-presets",
  "dsh-client-ui-agent-preset",
  "dsh-client-ui-model-selection",
  "dsh-client-ui-conversation",
  "dsh-client-ui-commands",
  "dsh-client-ui-message-feedback",
  "dsh-client-ui-goal",
  "dsh-client-ui-input-trigger",
  "dsh-client-ui-jobs",
  "dsh-client-ui-directory-picker-browse",
  "dsh-client-ui-workflow-run",
  "dsh-client-ui-deliverables",
  "dsh-client-ui-sidebar",
  "dsh-client-ui-settings-general",
  "dsh-client-ui-theme",
  "dsh-client-ui-user-questions",
  "dsh-client-ui-trajectory",
  "dsh-client-ui-settings-plugins",
  "dsh-client-ui-settings-plugin-inventory",
  "dsh-client-ui-workspace",
  "dsh-client-ui-subagent",
  "dsh-client-ui-settings-models",
  "dsh-client-ui-skill",
  "dsh-session-log-export",
  "dsh-client-ui-plan",
  "dsh-client-ui-reference",
];

// ---------- 小工具 ----------
function findMatchingBrace(text, openIdx) {
  // text[openIdx] === '{' ；返回匹配 '}' 的下标（含字符串转义处理）
  let depth = 0, i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === quote) break;
        i++;
      }
    } else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

function extractConsts(text) {
  // 收集 const NAME = <string|object>; —— 字符串立即解析；对象在 resolve 时才
  // 做括号匹配（lazy），避免大文件 O(n²) 扫描。
  const map = new Map(); // name -> { kind: 'str', value: string } | { kind: 'obj', pos: number }
  const re = /const\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = m[1];
    let i = re.lastIndex;
    if (text[i] === '"' || text[i] === "'") {
      const quote = text[i];
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === "\\") { j += 2; continue; }
        if (text[j] === quote) break;
        j++;
      }
      const raw = text.slice(i, j + 1);
      map.set(name, { kind: "str", value: raw });
      re.lastIndex = j + 1;
    } else if (text[i] === "{") {
      map.set(name, { kind: "obj", pos: i });
      // 不匹配括号：lazy。向前跳过一个简单对象以防误匹配内部 const（可选）
    }
  }
  return map;
}

const braceCache = new Map(); // text -> Map(name, literal|null)

function resolveConstValue(constMap, text, name) {
  const entry = constMap.get(name);
  if (!entry) return undefined;
  if (entry.kind === "str") return entry.value;
  // lazy 括号匹配 + 缓存
  let cache = braceCache.get(text);
  if (!cache) { cache = new Map(); braceCache.set(text, cache); }
  if (cache.has(name)) return cache.get(name);
  const close = findMatchingBrace(text, entry.pos);
  const literal = close !== -1 ? text.slice(entry.pos, close + 1) : null;
  cache.set(name, literal);
  return literal;
}

function resolveIdentifiers(literal, constMap, text, seen = new Set()) {
  // 字串感知扫描：跳过字符串字面量内容；识别字面量里的标识符 token。
  //  - 成员访问链 IDENT.KEY / IDENT["KEY"]（IDENT 是 constMap 中的对象 const）→ 用 const 值解析
  //  - 裸标识符（constMap 中的字符串/对象 const）→ 内联其值（对象值递归解析）
  const isIdentChar = (c) => /[A-Za-z0-9_$]/.test(c);
  const isIdentStart = (c) => /[A-Za-z_$]/.test(c);
  let out = "";
  let i = 0;
  while (i < literal.length) {
    const ch = literal[i];
    if (ch === '"' || ch === "'") {
      // 字符串字面量：原样拷贝
      const quote = ch;
      let j = i + 1;
      while (j < literal.length) {
        if (literal[j] === "\\") { j += 2; continue; }
        if (literal[j] === quote) break;
        j++;
      }
      out += literal.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === "`") {
      // 模板字面量：原样拷贝（含 ${...}，不做标识符替换）
      let j = i + 1;
      while (j < literal.length) {
        if (literal[j] === "\\") { j += 2; continue; }
        if (literal[j] === "`") break;
        j++;
      }
      out += literal.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < literal.length && isIdentChar(literal[j])) j++;
      const name = literal.slice(i, j);
      // 看后面是否跟着成员访问或冒号（跳过空白）
      let k = j;
      while (k < literal.length && /\s/.test(literal[k])) k++;
      // object key（IDENT 后跟 ':'）不参与解析，原样拷贝
      if (literal[k] === ":") {
        out += literal.slice(i, j);
        i = j;
        continue;
      }
      let isMember = false;
      if (literal[k] === "." && k + 1 < literal.length && isIdentStart(literal[k + 1])) isMember = true;
      else if (literal[k] === "[" && (literal[k + 1] === '"' || literal[k + 1] === "'")) isMember = true;

      if (isMember && !seen.has(name)) {
        // 解析成员访问链
        const raw = resolveConstValue(constMap, text, name);
        if (raw !== undefined && raw.startsWith("{")) {
          let obj;
          try {
            obj = eval("(" + resolveIdentifiers(raw, constMap, text, new Set([...seen, name])) + ")");
          } catch { obj = undefined; }
          if (obj !== undefined) {
            let cursor = k;
            let value = obj;
            let ok = true;
            while (cursor < literal.length) {
              while (cursor < literal.length && /\s/.test(literal[cursor])) cursor++;
              if (literal[cursor] === ".") {
                cursor++;
                let mj = cursor;
                while (mj < literal.length && isIdentChar(literal[mj])) mj++;
                const key = literal.slice(cursor, mj);
                if (mj === cursor || typeof value !== "object" || value === null || !(key in value)) { ok = false; break; }
                value = value[key];
                cursor = mj;
              } else if (literal[cursor] === "[") {
                cursor++;
                while (cursor < literal.length && /\s/.test(literal[cursor])) cursor++;
                if (literal[cursor] !== '"' && literal[cursor] !== "'") { ok = false; break; }
                const quote = literal[cursor];
                let mj = cursor + 1;
                while (mj < literal.length) {
                  if (literal[mj] === "\\") { mj += 2; continue; }
                  if (literal[mj] === quote) break;
                  mj++;
                }
                const key = literal.slice(cursor + 1, mj);
                cursor = mj + 1;
                while (cursor < literal.length && /\s/.test(literal[cursor])) cursor++;
                if (literal[cursor] !== "]") { ok = false; break; }
                cursor++;
                if (typeof value !== "object" || value === null || !(key in value)) { ok = false; break; }
                value = value[key];
              } else {
                break;
              }
            }
            if (ok) {
              out += JSON.stringify(value);
              i = cursor;
              continue;
            }
          }
        }
        // 解析失败：按裸标识符处理（fall through）
      }
      // 裸标识符
      if (constMap.has(name) && !seen.has(name)) {
        const raw = resolveConstValue(constMap, text, name);
        if (raw !== undefined) {
          if (raw.startsWith('"') || raw.startsWith("'")) {
            out += raw;
          } else {
            out += resolveIdentifiers(raw, constMap, text, new Set([...seen, name]));
          }
          i = j;
          continue;
        }
      }
      out += name;
      i = j;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function evalObject(literal, constMap, text) {
  const resolved = resolveIdentifiers(literal, constMap, text);
  try {
    return eval("(" + resolved + ")");
  } catch (e) {
    if (process.env.DEBUG_RESOLVED) {
      fs.writeFileSync(path.join(import.meta.dirname, "..", "src", "debug-resolved.txt"), resolved, "utf8");
    }
    throw new Error("evalObject failed: " + e.message + "\n--- literal head ---\n" + resolved.slice(0, 400));
  }
}

function extractRegisterEntries(text, constMap) {
  // 找所有 locale.register( ... ) 调用
  const entries = [];
  const re = /(?:ctx\.)?locale\.register\s*\(/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const open = text.indexOf("(", m.index + m[0].length - 1);
    const close = findMatchingParen(text, open);
    if (close === -1) {
      re.lastIndex = open + 1; // 未闭合，跳过避免死循环
      continue;
    }
    const call = text.slice(open + 1, close);
    re.lastIndex = close + 1;
    entries.push(call);
  }
  return entries;
}

function findMatchingParen(text, openIdx) {
  let depth = 0, i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch; i++;
      while (i < text.length) {
        if (text[i] === "\\") { i += 2; continue; }
        if (text[i] === quote) break;
        i++;
      }
    } else if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

function parseNsArg(arg, constMap, text) {
  arg = arg.trim();
  if (arg.startsWith('"') || arg.startsWith("'")) {
    try { return JSON.parse(arg); } catch { return arg.slice(1, -1); }
  }
  const raw = resolveConstValue(constMap, text, arg);
  if (raw !== undefined && (raw.startsWith('"') || raw.startsWith("'"))) {
    try { return JSON.parse(raw); } catch { return raw.slice(1, -1); }
  }
  return arg; // 未解析的标识符（如 locale 循环变量）
}

function splitTopLevelArgs(call) {
  // 把 register(...) 的参数按顶层逗号切开（跳过字符串与大括号）
  const args = [];
  let depth = 0, cur = "", i = 0;
  while (i < call.length) {
    const ch = call[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch; cur += ch; i++;
      while (i < call.length) {
        cur += call[i];
        if (call[i] === "\\") { i++; if (i < call.length) cur += call[i]; i++; continue; }
        if (call[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { args.push(cur); cur = ""; i++; continue; }
    cur += ch;
    i++;
  }
  if (cur.trim()) args.push(cur);
  return args;
}

function splitTopLevelCommas(inner) {
  // 按顶层逗号切开对象属性（跳过字符串与嵌套括号）
  const parts = [];
  let depth = 0, cur = "", i = 0;
  while (i < inner.length) {
    const ch = inner[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch; cur += ch; i++;
      while (i < inner.length) {
        cur += inner[i];
        if (inner[i] === "\\") { i++; if (i < inner.length) cur += inner[i]; i++; continue; }
        if (inner[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === "{" || ch === "(" || ch === "[") depth++;
    else if (ch === "}" || ch === ")" || ch === "]") depth--;
    if (ch === "," && depth === 0) { parts.push(cur); cur = ""; i++; continue; }
    cur += ch;
    i++;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

function parseObjectProps(objText) {
  // 返回 [{ name, value }]，value 为 null 表示 shorthand（name 即标识符）
  const inner = objText.slice(1, -1);
  const props = splitTopLevelCommas(inner);
  const out = [];
  for (const p of props) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    let depth = 0, colon = -1;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '"' || ch === "'" || ch === "`") {
        const quote = ch; i++;
        while (i < trimmed.length) {
          if (trimmed[i] === "\\") { i++; continue; }
          if (trimmed[i] === quote) break;
          i++;
        }
        continue;
      }
      if (ch === "{" || ch === "(" || ch === "[") depth++;
      else if (ch === "}" || ch === ")" || ch === "]") depth--;
      else if (ch === ":" && depth === 0) { colon = i; break; }
    }
    if (colon === -1) out.push({ name: trimmed, value: null });
    else out.push({ name: trimmed.slice(0, colon).trim(), value: trimmed.slice(colon + 1).trim() });
  }
  return out;
}

// ---------- 主流程 ----------
const outDir = path.join(import.meta.dirname, "..", "src", "zh-src");
const enOutDir = path.join(import.meta.dirname, "..", "src", "en");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(enOutDir, { recursive: true });

const report = [];
let totalKeys = 0;

for (const pkg of PKGS) {
  process.stderr.write("extracting " + pkg + " ...\n");
  const file = path.join(root, pkg, "lib", "client.js");
  if (!fs.existsSync(file)) throw new Error(`Missing installed DSH bundle: ${file}`);
  const text = fs.readFileSync(file, "utf8");
  const constMap = extractConsts(text);
  const entries = [];
  const seenNs = new Set();

  // 形态 A/B：register(...) 调用
  for (const call of extractRegisterEntries(text, constMap)) {
    const args = splitTopLevelArgs(call);
    if (args.length < 2) continue;
    let ns = parseNsArg(args[0], constMap, text);
    if (typeof ns !== "string" || ns === "locale") continue; // 循环变量
    let zhDict = null, enDict = null;
    const second = args[1].trim();
    if (second.startsWith('"') || second.startsWith("'")) {
      // register(NS, "zh"/"en", {...})
      const localeName = parseNsArg(second, constMap, text);
      if (args[2]) {
        if (localeName === "zh") {
          try { zhDict = evalObject(args[2], constMap, text); } catch (e) { report.push({ pkg, ns, error: "inline zh eval: " + e.message }); }
        } else if (localeName === "en") {
          try { enDict = evalObject(args[2], constMap, text); } catch (e) { report.push({ pkg, ns, error: "inline en eval: " + e.message }); }
        }
      }
    } else if (second.startsWith("{")) {
      // register(NS, { zh: ..., en: ... }) 或 shorthand { zh, en }
      const props = parseObjectProps(second);
      const resolveProp = (prop) => {
        if (prop === undefined) return undefined;
        if (prop.value === null) {
          // shorthand：名称即标识符
          const raw = resolveConstValue(constMap, text, prop.name);
          if (raw === undefined) { report.push({ pkg, ns, error: `shorthand ${prop.name} const not found` }); return undefined; }
          try { return evalObject(raw, constMap, text); } catch (e) { report.push({ pkg, ns, error: `const ${prop.name}: ` + e.message }); return undefined; }
        } else if (prop.value.startsWith("{")) {
          try { return evalObject(prop.value, constMap, text); } catch (e) { report.push({ pkg, ns, error: `inline obj ${prop.name}: ` + e.message }); return undefined; }
        } else {
          const raw = resolveConstValue(constMap, text, prop.value);
          if (raw === undefined) { report.push({ pkg, ns, error: `const ${prop.value} not found` }); return undefined; }
          try { return evalObject(raw, constMap, text); } catch (e) { report.push({ pkg, ns, error: `const ${prop.value}: ` + e.message }); return undefined; }
        }
      };
      zhDict = resolveProp(props.find((p) => p.name === "zh"));
      enDict = resolveProp(props.find((p) => p.name === "en"));
      if (zhDict === null && enDict === null) report.push({ pkg, ns, error: "no zh/en key in register object" });
    }
    if (zhDict !== null || enDict !== null) {
      // 同一 ns 可能有多個 register call（例如 inline "zh" 與 inline "en" 分開寫），合併而非跳過
      const existing = entries.find((e) => e.ns === ns);
      if (existing) {
        if (zhDict !== null && existing.zh === null) existing.zh = zhDict;
        if (enDict !== null && existing.en === null) existing.en = enDict;
      } else {
        entries.push({ ns, zh: zhDict, en: enDict });
      }
      seenNs.add(ns);
    }
  }

  // 形态 C：dictionaries = [["zh", {...}], ["en", {...}], ...] （directory-picker-browse）
  const dictArrRe = /const\s+dictionaries\s*=\s*(\[[^]*?\]);/;
  const dictArrM = dictArrRe.exec(text);
  if (dictArrM && !seenNs.has("directory-picker")) {
    // 尝试找 LOCALE_NS 的值
    let ns = "directory-picker";
    const nsConst = /const\s+LOCALE_NS\s*=\s*"([^"]+)"/.exec(text);
    if (nsConst) ns = nsConst[1];
    const zhMatch = dictArrM[1].match(/\[\s*"zh"\s*,\s*(\{[^]*?\})\s*\]/);
    const enMatch = dictArrM[1].match(/\[\s*"en"\s*,\s*(\{[^]*?\})\s*\]/);
    const dict = { zh: zhMatch ? evalObject(zhMatch[1], constMap, text) : null, en: enMatch ? evalObject(enMatch[1], constMap, text) : null };
    if (dict.zh !== null || dict.en !== null) {
      try { entries.push({ ns, zh: dict.zh, en: dict.en }); seenNs.add(ns); }
      catch (e) { report.push({ pkg, ns, error: "dictionaries: " + e.message }); }
    }
  }

  if (entries.length === 0) throw new Error(`No locale entries extracted from ${file}; installed DSH format may have changed`);
  const zhOut = { pkg, entries: entries.filter((e) => e.zh !== null).map((e) => ({ ns: e.ns, dict: e.zh })) };
  const enOut = { pkg, entries: entries.filter((e) => e.en !== null).map((e) => ({ ns: e.ns, dict: e.en })) };
  fs.writeFileSync(path.join(outDir, pkg + ".json"), JSON.stringify(zhOut, null, 2), "utf8");
  fs.writeFileSync(path.join(enOutDir, pkg + ".json"), JSON.stringify(enOut, null, 2), "utf8");
  const keyCount = zhOut.entries.reduce((n, e) => n + Object.keys(e.dict).length, 0);
  totalKeys += keyCount;
  report.push({ pkg, namespaces: zhOut.entries.map((e) => `${e.ns}(${Object.keys(e.dict).length})`).join(", "), keys: keyCount });
}

console.log(JSON.stringify(report, null, 2));
console.log("TOTAL zh keys:", totalKeys);
