import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";

const root = path.join(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
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
  NodeFilter: { SHOW_ELEMENT: 1, SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3 },
  console,
};
win.document = documentMock;
vm.createContext(sandbox);
vm.runInContext(clientSrc, sandbox);
const spec = win.__spec;
if (!spec || spec.id !== pkg.name || typeof spec.factory !== "function") {
  console.error(`FAIL: bundle registered ${JSON.stringify(spec?.id)} instead of ${JSON.stringify(pkg.name)}`);
  process.exit(1);
}
const mod = spec.factory(() => { throw new Error("require not used"); });
if (!mod || typeof mod.apply !== "function") { console.error("FAIL: no apply"); process.exit(1); }

// ---- faithful locale-service mock (mirrors dsh-client-locale 0.1.5-rc.2) ----
const localeKey = (v) => String(v).toLowerCase();
const dicts = new Map(); // ns -> Map(langKey -> dict)
const catalog = new Map([
  ["zh", { id: "zh", label: "中文", fallback: "en" }],
  ["en", { id: "en", label: "English" }],
]);
const locale = {
  dicts,
  state: {
    active: "en",
    locales: [{ id: "en", label: "English" }, { id: "zh", label: "中文" }],
    revision: 1,
  },
  addLanguage(input) {
    const key = localeKey(input.id);
    if (catalog.has(key)) throw new Error(`locale "${input.id}" is already registered`);
    if (!catalog.has(localeKey(input.fallback))) throw new Error(`locale fallback "${input.fallback}" is not registered`);
    const language = Object.freeze({ id: input.id, label: input.label, fallback: input.fallback });
    catalog.set(key, language);
    this.state = {
      ...this.state,
      locales: [...catalog.values()],
      revision: this.state.revision + 1,
    };
    return () => {
      catalog.delete(key);
      this.state = { ...this.state, locales: [...catalog.values()], revision: this.state.revision + 1 };
    };
  },
  register(ns, lang, dict) {
    if (!dicts.has(ns)) dicts.set(ns, new Map());
    dicts.get(ns).set(localeKey(lang), dict);
  },
  getLocale() { return this.state; },
  publish(id, force, locales) {
    this.state = {
      ...this.state,
      active: id,
      locales: locales ?? this.state.locales,
      revision: this.state.revision + 1,
    };
  },
  setLocale(id) {
    const match = catalog.get(localeKey(id));
    if (!match) throw new Error(`locale "${id}" is not registered`);
    this.publish(match.id, true);
  },
  translate(ns, key, params) {
    const active = this.state.active;
    const dict = this.dicts.get(ns)?.get(localeKey(active)) ?? this.dicts.get("common")?.get(localeKey(active));
    if (!dict || dict[key] === undefined) return key;
    let v = dict[key];
    if (params) v = v.replace(/\{(\w+)\}/g, (m, n) => (n in params ? String(params[n]) : m));
    return v;
  },
  adopt(host) {},
};

const effects = [];
const ctx = {
  get: (k) => (k === "locale" ? locale : undefined),
  effect: (fn) => {
    const dispose = fn();
    if (typeof dispose === "function") effects.push(dispose);
    return dispose;
  },
};

// ---- run apply ----
mod.apply(ctx);

let failures = 0;
const ok = (cond, name, detail = "") => { if (cond) console.log("PASS " + name); else { failures++; console.log("FAIL " + name + (detail ? ": " + detail : "")); } };

ok(Array.isArray(mod.inject) && mod.inject.includes("locale"), "inject includes locale", JSON.stringify(mod.inject));
ok(clientSrc.includes("addLanguage"), "bundle uses addLanguage");
ok(clientSrc.includes("localeKey"), "bundle uses localeKey for dict lookups");

// 1) all 20 locales registered in catalog + dictionaries
const { locales } = await import(pathToFileURL(path.join(root, "scripts", "locales.mjs")).href);
let totalReg = 0;
for (const L of locales) {
  ok(catalog.has(localeKey(L.id)), "catalog has " + L.id);
  let keys = 0;
  for (const nsMap of dicts.values()) keys += Object.keys(nsMap.get(localeKey(L.id)) ?? {}).length;
  if (keys !== 715) ok(false, "locale " + L.id + " keys=" + keys, "expected 715");
  else totalReg++;
}
ok(totalReg === 20, "all 20 locales registered with 715 keys", totalReg + "/20");
ok(clientSrc.includes("characterData: false"), "observers omit characterData");
ok(!clientSrc.includes("characterData: true"), "no characterData:true observers");
ok(clientSrc.includes("[data-conversation-scroll]"), "skip conversation scrollport");
ok(clientSrc.includes("[data-agent-teams-panel-open]"), "skip AgentTeams panel");

// 2) curated translate for a sample across locales (case-insensitive dict keys)
locale.setLocale("fr");
const frKey = Object.keys(dicts.get("conversation").get("fr"))[0];
const fr = locale.translate("conversation", frKey);
ok(typeof fr === "string" && fr.length > 0 && fr !== frKey, "translate returns curated string under fr", JSON.stringify(fr));

// 2b) Traditional Chinese activates via setLocale and converts Simplified fallback
locale.setLocale("zh-HK");
ok(locale.getLocale().active === "zh-HK", "setLocale accepts zh-HK from catalog");
ok(documentMock.documentElement.lang === "zh-HK", "document lang is zh-HK");
const hkSample = locale.translate("settings.locale", "language.title");
ok(typeof hkSample === "string" && hkSample.length > 0, "zh-HK translate returns string", JSON.stringify(hkSample));

// 3) RTL toggle
locale.setLocale("ar");
ok(documentMock.documentElement.dir === "rtl", "ar sets dir=rtl", documentMock.documentElement.dir);
locale.setLocale("fr");
ok(documentMock.documentElement.dir === "ltr", "fr restores dir=ltr", documentMock.documentElement.dir);

// 4) unknown key graceful
const unknown = locale.translate("nonexistent.ns", "no.such.key");
ok(unknown === "no.such.key", "unknown key returns key itself", JSON.stringify(unknown));

// 5) preference round-trip survives adopt
localStorageMock.setItem("dsh-i18n.preference", "zh-TW");
locale.adopt({});
ok(locale.getLocale().active === "zh-TW", "adopt re-asserts localStorage preference", locale.getLocale().active);

console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
