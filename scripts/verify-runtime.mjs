import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "..");
const clientSrc = fs.readFileSync(path.join(root, "lib", "client.js"), "utf8");

// ---- minimal DOM/window mocks ----
function makeTextNode(value) { return { nodeType: 3, nodeValue: value, parentElement: null }; }
const documentMock = {
  documentElement: { lang: "en", dir: "ltr" },
  body: { childNodes: [], matches: () => false, parentElement: null },
  createTreeWalker() { return { nextNode: () => null }; },
};
const localStorageMock = (() => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
})();
const win = {
  __ModuleLoader__: { load: (spec) => { win.__spec = spec; } },
  localStorage: localStorageMock,
  setTimeout: () => 0,
};

const sandbox = {
  window: win,
  document: documentMock,
  NodeFilter: { SHOW_TEXT: 4 },
  console,
};
win.document = documentMock;
vm.createContext(sandbox);
vm.runInContext(clientSrc, sandbox);
const spec = win.__spec;
if (!spec || spec.id !== "dsh-i18n" || typeof spec.factory !== "function") {
  console.error("FAIL: bundle did not register expected module");
  process.exit(1);
}
const mod = spec.factory(() => { throw new Error("require not used"); });
if (!mod || typeof mod.apply !== "function") { console.error("FAIL: no apply"); process.exit(1); }

// ---- faithful locale-service mock ----
const dicts = new Map(); // ns -> Map(lang -> dict)
const locale = {
  dicts,
  state: { active: "en", locales: [{ id: "en", label: "English" }, { id: "zh", label: "中文" }], revision: 1 },
  register(ns, lang, dict) {
    if (!dicts.has(ns)) dicts.set(ns, new Map());
    dicts.get(ns).set(lang, dict);
  },
  getLocale() { return this.state; },
  publish(id, force) { this.state = { ...this.state, active: id, revision: this.state.revision + 1 }; },
  setLocale(id) { this.publish(id, true); },
  translate(ns, key, params) {
    const active = this.state.active;
    const dict = this.dicts.get(ns)?.get(active) ?? this.dicts.get("common")?.get(active);
    if (!dict || dict[key] === undefined) return key;
    let v = dict[key];
    if (params) v = v.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m));
    return v;
  },
  adopt(host) {},
};

const ctx = { get: (k) => (k === "locale" ? locale : undefined), effect: (fn) => fn() };

// ---- run apply ----
mod.apply(ctx);

let failures = 0;
const ok = (cond, name, detail = "") => { if (cond) console.log("PASS " + name); else { failures++; console.log("FAIL " + name + (detail ? ": " + detail : "")); } };

// 1) all 20 locales registered, 715 keys each
const { locales } = await import(pathToFileURL(path.join(root, "scripts", "locales.mjs")).href);
let totalReg = 0;
for (const L of locales) {
  let keys = 0;
  for (const nsMap of dicts.values()) keys += Object.keys(nsMap.get(L.id) ?? {}).length;
  if (keys !== 715) ok(false, "locale " + L.id + " keys=" + keys, "expected 715");
  else totalReg++;
}
ok(totalReg === 20, "all 20 locales registered with 715 keys", totalReg + "/20");

// 2) curated translate for a sample across locales
locale.setLocale("fr");
const fr = locale.translate("conversation", Object.keys(dicts.get("conversation").get("fr"))[0]);
ok(typeof fr === "string" && fr.length > 0, "translate returns curated string under fr", JSON.stringify(fr));

// 3) RTL toggle
locale.setLocale("ar");
ok(documentMock.documentElement.dir === "rtl", "ar sets dir=rtl", documentMock.documentElement.dir);
locale.setLocale("fr");
ok(documentMock.documentElement.dir === "ltr", "fr restores dir=ltr", documentMock.documentElement.dir);

// 4) unknown key graceful
const unknown = locale.translate("nonexistent.ns", "no.such.key");
ok(unknown === "no.such.key", "unknown key returns key itself", JSON.stringify(unknown));

console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
