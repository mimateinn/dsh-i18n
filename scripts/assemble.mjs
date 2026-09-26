// assemble.mjs — 从 src/<lang>/*.json 生成 lib/client.js（内嵌全部语言字典 + 插件逻辑）
// 用法: node scripts/assemble.mjs
import fs from "node:fs";
import path from "node:path";
import { locales } from "./locales.mjs";

const root = path.join(import.meta.dirname, "..");
const outFile = path.join(root, "lib", "client.js");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
// DSH client-modules keys the graph row by package.json "name". Registering
// the old unscoped id ("dsh-i18n") makes Desktop fail the whole plugin table:
// bundle loaded without registering "@mimateinn/dsh-i18n" via __ModuleLoader__.load
const CLIENT_MODULE_ID = pkg.name;
if (typeof CLIENT_MODULE_ID !== "string" || CLIENT_MODULE_ID.length === 0) {
  throw new Error("package.json name is required as the ModuleLoader id");
}

// 语言注册表：dir 为 src/ 下的字典目录（小写），id 为 locale id，label 为语言行显示名。
// useConvert=true 表示该语言支持「简中字元表即时转换」兜底（目前只有 zh-TW 同源可行）；
// 其他语言缺精译时 fallback 英文（en 字典由官方注册，全部 namespace 齐备）。
const LANGUAGES = locales.map(({ id, dir, label, traditional, rtl }) => ({
  id, dir, label, useConvert: Boolean(traditional), rtl: Boolean(rtl),
}));

const dicts = {}; // langId -> { ns -> dict }
for (const lang of LANGUAGES) {
  const langDir = path.join(root, "src", lang.dir);
  if (!fs.existsSync(langDir)) throw new Error(`missing src/${lang.dir}/ — 先翻译好该语言再 assemble`);
  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json")).sort();
  const perLang = {};
  let keys = 0;
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(langDir, f), "utf8"));
    for (const entry of data.entries) {
      if (perLang[entry.ns]) throw new Error(`duplicate ns ${entry.ns} in ${f}`);
      perLang[entry.ns] = entry.dict;
      keys += Object.keys(entry.dict).length;
    }
  }
  dicts[lang.id] = perLang;
  console.log(`  ${lang.id} (${lang.dir}): ${files.length} files, ${keys} keys`);
}

// 单字简→繁字元表（zh-TW 运行时兜底用）
const CHARS = JSON.parse(fs.readFileSync(path.join(root, "src", "zh-tw-parts", "chars.json"), "utf8"));
console.log(`char table: ${Object.keys(CHARS).length} entries`);

const LANGUAGES_JSON = JSON.stringify(LANGUAGES.map(({ id, label, useConvert, rtl }) => ({ id, label, useConvert, rtl })));
const DICTS_JSON = JSON.stringify(dicts);
const CHARS_JSON = JSON.stringify(CHARS);

const clientJs = `/* global window */
// lib/client.js — dsh-i18n 的 Browser 侧 bundle（手写 CJS factory，供 dsh web
// 客户端 ModuleLoader 注入）。
//
// 职责：
//  1. 为全部 locale namespace 注册多语言（繁體中文 / 日本語 / 한국어 / Français /
//     Deutsch / Español）字典——各语言由英文（en）或简体中文（zh）基准逐条翻译而来，
//     经 dsh-client-locale 的 LocaleRuntime 随 DSH web 语言设置切换；
//  2. 缺精译兜底：zh-TW 用内置简→繁字元表即时转繁（覆盖官方新增/改动字串与第三方
//     插件 namespace）；其他语言 fallback 英文（en 字典官方齐备），不会出现乱码；
//  3. 把全部语言加入设置页「语言」选择行（patch locale snapshot + 触发
//     locale/change 刷新语言行选项，并包装 setLocale 接受全部语言 id）；
//  4. 用 localStorage 持久化用户选择（语言偏好本就是浏览器本地偏好；内置 locale
//     的 settings 通道对 remote browser 也不持久，且 apiproxy 的 settings 白名单
//     不向插件开放自定义 namespace），刷新后保持语言选择。
//
// 依赖注入：@deepseek-ai/dsh-client-locale（locale 服务）；locale 服务缺失时
// 静默降级（不注册字典、不改语言行），不破坏其他插件。
window.__ModuleLoader__.load({
  id: ${JSON.stringify(CLIENT_MODULE_ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const LANGUAGES = ${LANGUAGES_JSON};
    const STORAGE_KEY = "dsh-i18n.preference";
    // 舊包名遷移鏈：dsh-multi-lang-ui → dsh-zh-tw-ui → dsh-locale-zh-tw
    const LEGACY_STORAGE_KEYS = ["dsh-multi-lang-ui.preference", "dsh-zh-tw-ui.preference", "dsh-locale-zh-tw.preference"];

    // 全部语言的精译字典（由 scripts/assemble.mjs 生成；质量基准）
    const DICTS = ${DICTS_JSON};

    // 单字简→繁字元表（zh-TW 运行时兜底；scripts/verify-converter.mjs 校验）
    const CHARS = ${CHARS_JSON};

    const name = "dsh-i18n";
    // locale is required for dictionary registration; connection is optional for LLM auto-MT.
    const inject = ["locale", "connection"];

    // Match dsh-client-locale's case-insensitive Map key (value.toLowerCase()).
    function localeKey(value) {
      return String(value).toLowerCase();
    }

    // 纯单字简→繁转换（不做術語片語；{佔位符} 内无汉字，天然安全）。
    // fast-path：先扫一遍有没有需要转换的字，没有就直接返回原串（避免热路径分配）。
    const CHARS_SET = new Set(Object.keys(CHARS));
    function convertZhTw(text) {
      let need = false;
      for (const ch of text) {
        if (CHARS_SET.has(ch)) { need = true; break; }
      }
      if (!need) return text;
      let out = "";
      for (const ch of text) out += CHARS[ch] ?? ch;
      return out;
    }

    function applyParams(template, params) {
      if (!params) return template;
      return template.replace(/\\{(\\w+)\\}/g, (match, name) => name in params ? String(params[name]) : match);
    }

    function dictLookup(dicts, ns, langId, key) {
      if (!dicts || typeof dicts.get !== "function") return undefined;
      const locales = dicts.get(ns);
      if (!locales || typeof locales.get !== "function") return undefined;
      return locales.get(localeKey(langId))?.[key];
    }

    function readPref() {
      try {
        let value = window.localStorage.getItem(STORAGE_KEY);
        if (value === null) {
          for (const legacy of LEGACY_STORAGE_KEYS) {
            const old = window.localStorage.getItem(legacy);
            if (old !== null) {
              window.localStorage.setItem(STORAGE_KEY, old);
              window.localStorage.removeItem(legacy);
              value = old;
              break;
            }
          }
        }
        return value;
      } catch { return null; }
    }
    function writePref(value) {
      try {
        if (value === null || value === undefined) window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, value);
        for (const legacy of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(legacy);
      } catch { /* 隐私模式等：忽略，语言选择在本次会话内生效 */ }
    }

    // ---- DOM 级兜底轉換（僅 zh-TW）----
    // locale.translate 只覆盖字典字串；插件市场描述、第三方插件的自有文案等由
    // 数据/组件直接渲染的内容不经字典。zh-TW 活跃时用 MutationObserver 把 DOM 里
    // 残留的简体即时转繁（输入框/代码块等用户内容排除），切回其他语言时还原。
    // （其他语言无法做字符级自动转换，非字典内容保持原文。）
    // Conversation / composer / AgentTeams live surfaces stream token text as
    // characterData. Walking those on every token stalls the renderer so the
    // model keeps running while glyphs never paint. Skip them; chrome/settings
    // still get conversion via childList.
    const DOM_SKIP_SELECTOR = "input, textarea, select, [contenteditable], pre, code, script, style, [data-conversation-scroll], [data-composer-input], [data-composer-card], [data-composer-seat], [data-team-id], [data-agent-teams-panel-open], [data-agent-teams-collapsed], [data-recovery], [data-renderer-recovery], [data-boot-recovery]";
    const domConverted = new WeakMap(); // Text -> 原始字符串
    let domObserver = null;
    let domOriginalLang = null;
    let domRaf = 0;
    let domQueued = null;

    function closestMatches(node, selector) {
      let el = node.nodeType === 1 ? node : node.parentElement;
      while (el) {
        if (el.matches && el.matches(selector)) return true;
        el = el.parentElement;
      }
      return false;
    }
    function isProtectedChromeText(text) {
      const t = text || "";
      return /require\\(|missed the module|Recovery Mode|恢复模式|恢復模式|client-modules:|__ModuleLoader__|entrypoint|dsh-client-runtime/.test(t);
    }
    function domShouldSkip(node) {
      if (closestMatches(node, DOM_SKIP_SELECTOR)) return true;
      if (node.nodeType === 3 && isProtectedChromeText(node.nodeValue)) return true;
      return false;
    }
    function scheduleDomWork(fn) {
      if (!domQueued) domQueued = [];
      domQueued.push(fn);
      if (domRaf) return;
      const run = () => {
        domRaf = 0;
        const jobs = domQueued;
        domQueued = null;
        if (!jobs) return;
        for (const job of jobs) job();
      };
      if (typeof requestAnimationFrame === "function") domRaf = requestAnimationFrame(run);
      else domRaf = window.setTimeout(run, 16);
    }
    function domConvertText(node) {
      if (node.nodeType !== 3 || domShouldSkip(node)) return;
      const original = node.nodeValue;
      if (!original) return;
      const converted = convertZhTw(original);
      if (converted !== original) {
        if (!domConverted.has(node)) domConverted.set(node, original);
        node.nodeValue = converted;
      }
    }
    function domRestoreText(node) {
      if (node.nodeType === 3 && domConverted.has(node)) {
        node.nodeValue = domConverted.get(node);
        domConverted.delete(node);
      }
    }
    function skipFilter(node) {
      if (node.nodeType === 1) {
        return node.matches && node.matches(DOM_SKIP_SELECTOR)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_SKIP;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
    function domWalk(root, fn) {
      if (root.nodeType === 3) { if (!domShouldSkip(root)) fn(root); return; }
      if (root.nodeType !== 1) return;
      if (root.matches && root.matches(DOM_SKIP_SELECTOR)) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: skipFilter });
      let n;
      while ((n = walker.nextNode())) fn(n);
    }
    function startDomConversion(activeId) {
      if (domObserver) return;
      try {
        domOriginalLang = domOriginalLang ?? document.documentElement.lang;
        document.documentElement.lang = activeId || "zh-TW";
      } catch { /* 忽略 */ }
      domWalk(document.body, domConvertText);
      if (typeof MutationObserver !== "undefined") {
        try {
          domObserver = new MutationObserver((mutations) => {
            scheduleDomWork(() => {
              for (const m of mutations) {
                if (m.type === "characterData") continue;
                if (m.type === "childList") {
                  for (const n of m.addedNodes) {
                    if (n.nodeType === 3 && !domShouldSkip(n)) domConvertText(n);
                    else if (n.nodeType === 1 && !domShouldSkip(n)) domWalk(n, domConvertText);
                  }
                }
              }
            });
          });
          domObserver.observe(document.body, { childList: true, subtree: true, characterData: false });
        } catch { /* ignore */ }
      }
    }
    function stopDomConversion() {
      if (domRaf) {
        if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(domRaf);
        else window.clearTimeout(domRaf);
        domRaf = 0;
        domQueued = null;
      }
      if (domObserver) {
        domObserver.disconnect();
        domObserver = null;
      }
      domWalk(document.body, domRestoreText);
      try {
        if (domOriginalLang !== null) document.documentElement.lang = domOriginalLang;
      } catch { /* 忽略 */ }
    }
    function syncDocumentLocale(active) {
      const lang = LANGUAGES.find((item) => item.id === active);
      if (lang?.useConvert) startDomConversion(lang.id);
      else stopDomConversion();
      try {
        document.documentElement.lang = lang?.id ?? document.documentElement.lang;
        document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
      } catch { /* document may not be ready */ }
      if (mtRefresh) mtRefresh();
    }

    // ---- 自動翻譯（LLM）----
    // 當 active 係我哋嘅非繁中語言（ja/ko/fr/... 18 種）時，用 MutationObserver 捉
    // 英文長文本（市場描述等），批量經 /dsh-i18n RPC 翻譯做目標語言。快取 + 冪等，
    // 頂住 React re-render 覆寫；預設語言（en/zh）唔翻譯，繁中保留簡轉繁。
    let mtRefresh = null;

    function apply(ctx) {
      const locale = ctx.get("locale");
      if (!locale || typeof locale.register !== "function" || typeof locale.getLocale !== "function") {
        console.warn("[dsh-i18n] locale service unavailable; plugin degraded");
        return;
      }

      const isOurs = (id) => LANGUAGES.some((l) => l.id === id || localeKey(l.id) === localeKey(id));
      const findLang = (id) => LANGUAGES.find((l) => l.id === id || localeKey(l.id) === localeKey(id));

      // 0) Register languages into the official catalog (Harness 0.1.5+).
      //    setLocale only accepts catalog ids; snapshot patching alone is not enough.
      //    Traditional locales fall back to zh (then convert); others fall back to en.
      const languageDisposers = [];
      if (typeof locale.addLanguage === "function") {
        for (const lang of LANGUAGES) {
          try {
            const dispose = locale.addLanguage({
              id: lang.id,
              label: lang.label,
              fallback: lang.useConvert ? "zh" : "en",
            });
            if (typeof dispose === "function") languageDisposers.push(dispose);
          } catch (error) {
            // Already registered (HMR / double apply) — keep going.
            if (!/already registered/i.test(String(error && error.message || error))) {
              console.error("[dsh-i18n] addLanguage", lang.id, error);
            }
          }
        }
        if (languageDisposers.length) {
          ctx.effect(() => () => { for (const d of languageDisposers) try { d(); } catch { /* ignore */ } }, "dsh-i18n: languages");
        }
      } else {
        // Legacy hosts without addLanguage: patch the snapshot option list.
        const snapshot = locale.getLocale();
        const locales = [...snapshot.locales];
        for (const lang of LANGUAGES) {
          if (!locales.some((l) => localeKey(l.id) === localeKey(lang.id))) {
            locales.push({ id: lang.id, label: lang.label });
          }
        }
        try {
          locale.snapshot = Object.freeze({
            active: snapshot.active,
            locales: Object.freeze(locales),
            revision: snapshot.revision,
          });
          locale.publish(snapshot.active, true);
        } catch (error) {
          console.error("[dsh-i18n] patch snapshot", error);
        }
      }

      // 1) Register curated dictionaries (single-locale form).
      for (const [langId, perNs] of Object.entries(DICTS)) {
        for (const [ns, dict] of Object.entries(perNs)) {
          try {
            ctx.effect(() => locale.register(ns, langId, dict), "dsh-i18n: " + langId + "/" + ns);
          } catch (error) {
            console.error("[dsh-i18n] register", langId, ns, error);
          }
        }
      }

      // 1.5) Wrap translate: curated first (case-insensitive dict keys), then
      //      zh→繁 convert for Traditional locales / English for others.
      const originalTranslate = locale.translate.bind(locale);
      locale.translate = (ns, key, params) => {
        const active = locale.getLocale().active;
        const lang = findLang(active);
        if (lang === undefined) return originalTranslate(ns, key, params);
        const dicts = locale.dicts;
        const curated =
          dictLookup(dicts, ns, active, key) ??
          (ns !== "common" ? dictLookup(dicts, "common", active, key) : undefined);
        if (curated !== undefined) return applyParams(curated, params);
        const fallbackLang = lang.useConvert ? "zh" : "en";
        const fallback =
          dictLookup(dicts, ns, fallbackLang, key) ??
          (ns !== "common" ? dictLookup(dicts, "common", fallbackLang, key) : undefined);
        if (fallback !== undefined) {
          const value = lang.useConvert ? convertZhTw(fallback) : fallback;
          return applyParams(value, params);
        }
        return originalTranslate(ns, key, params);
      };

      // 2) Wrap setLocale: persist plugin preference + sync DOM/MT.
      //    With addLanguage, the original setLocale accepts our ids and writes Host settings.
      const originalSetLocale = locale.setLocale.bind(locale);
      locale.setLocale = (id) => {
        try {
          originalSetLocale(id);
        } catch (error) {
          // Legacy path: force-publish owned ids when catalog API is missing.
          if (isOurs(id) && typeof locale.publish === "function") {
            locale.publish(id, true);
          } else {
            throw error;
          }
        }
        writePref(isOurs(id) ? (findLang(id)?.id ?? id) : null);
        syncDocumentLocale(locale.getLocale().active);
      };

      // 3) Persist across Host adopt() resets (async settings load can clobber active).
      const activateIfPreferred = () => {
        const pref = readPref();
        if (pref === null || !isOurs(pref)) return;
        const want = findLang(pref)?.id ?? pref;
        if (locale.getLocale().active === want) return;
        try {
          originalSetLocale(want);
        } catch {
          try { locale.publish(want, true); } catch { /* ignore */ }
        }
        syncDocumentLocale(locale.getLocale().active);
      };
      if (typeof locale.adopt === "function") {
        const originalAdopt = locale.adopt.bind(locale);
        locale.adopt = (host) => {
          originalAdopt(host);
          activateIfPreferred();
          syncDocumentLocale(locale.getLocale().active);
        };
      }

      // 4) Auto-translate English long text via /api/dsh-i18n.translate (non-Traditional locales).
      const connection = (() => { try { return ctx.get("connection"); } catch { return null; } })();
      if (connection && connection.rpc && typeof connection.rpc.call === "function") {
        const MT_CONFIG_KEY = "dsh-i18n.mt";
        const translateCache = new Map();
        const pendingTexts = new Set();
        let mtTimer = null;
        let mtObserver = null;

        const mtActiveLang = () => locale.getLocale().active;
        const mtIsTarget = (id) => {
          const l = findLang(id);
          return Boolean(l && !l.useConvert);
        };
        const mtLooksTranslatable = (text) => {
          const t = (text || "").trim();
          if (t.length < 24 || t.length > 2000) return false;
          if (isProtectedChromeText(t)) return false;
          const words = t.split(/\\s+/).filter((w) => /[A-Za-z]/.test(w));
          if (words.length < 6) return false;
          let ascii = 0;
          for (const ch of t) if (ch.charCodeAt(0) < 128) ascii++;
          return ascii / t.length > 0.7;
        };
        const mtSkip = (node) => closestMatches(node, DOM_SKIP_SELECTOR);
        const mtHandleNode = (node) => {
          if (node.nodeType !== 3 || mtSkip(node)) return;
          const text = node.nodeValue;
          if (!text || !mtLooksTranslatable(text)) return;
          const cached = translateCache.get(text);
          if (cached !== undefined) {
            if (node.nodeValue !== cached) node.nodeValue = cached;
            return;
          }
          if (!pendingTexts.has(text)) {
            pendingTexts.add(text);
            if (!mtTimer) mtTimer = window.setTimeout(flushMt, 250);
          }
        };
        const mtWalk = (root) => {
          if (root.nodeType === 3) { mtHandleNode(root); return; }
          if (root.nodeType !== 1) return;
          if (root.matches && root.matches(DOM_SKIP_SELECTOR)) return;
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: skipFilter });
          let n;
          while ((n = walker.nextNode())) mtHandleNode(n);
        };
        function flushMt() {
          mtTimer = null;
          if (!pendingTexts.size) return;
          if (!mtIsTarget(mtActiveLang())) { pendingTexts.clear(); return; }
          const texts = [...pendingTexts].slice(0, 12);
          for (const t of texts) pendingTexts.delete(t);
          const targetLang = (findLang(mtActiveLang()) || {}).label;
          const cfg = (() => { try { return JSON.parse(window.localStorage.getItem(MT_CONFIG_KEY)) || {}; } catch { return {}; } })();
          const payload = { texts, targetLang };
          if (cfg.provider && cfg.model) {
            payload.provider = cfg.provider;
            payload.model = cfg.model;
            if (cfg.reasoningEffort) payload.reasoningEffort = cfg.reasoningEffort;
          }
          connection.rpc.call("/api", "dsh-i18n.translate", payload).then((result) => {
            if (!result || !result.ok) {
              const msg = result && result.error && result.error.message ? result.error.message : "translate failed";
              console.warn("[dsh-i18n] auto-translate:", msg);
              return;
            }
            if (!mtIsTarget(mtActiveLang())) return;
            const translations = result.value && result.value.translations;
            if (!Array.isArray(translations)) return;
            texts.forEach((t, i) => {
              const tr = translations[i];
              if (typeof tr === "string" && tr && tr !== t) translateCache.set(t, tr);
            });
            mtWalk(document.body);
          }).catch((error) => {
            console.warn("[dsh-i18n] auto-translate rpc error:", error instanceof Error ? error.message : error);
          });
          if (pendingTexts.size) mtTimer = window.setTimeout(flushMt, 250);
        }
        function startMt() {
          if (mtObserver) return;
          mtWalk(document.body);
          mtObserver = new MutationObserver((mutations) => {
            scheduleDomWork(() => {
              for (const m of mutations) {
                if (m.type === "characterData") continue;
                if (m.type === "childList") {
                  for (const added of m.addedNodes) {
                    if (added.nodeType === 3 && !mtSkip(added)) mtHandleNode(added);
                    else if (added.nodeType === 1 && !mtSkip(added)) mtWalk(added);
                  }
                }
              }
            });
          });
          mtObserver.observe(document.body, { childList: true, subtree: true, characterData: false });
        }
        function stopMt() {
          if (mtObserver) { mtObserver.disconnect(); mtObserver = null; }
          if (mtTimer) { window.clearTimeout(mtTimer); mtTimer = null; }
          pendingTexts.clear();
        }
        mtRefresh = () => {
          if (mtIsTarget(mtActiveLang())) startMt();
          else stopMt();
        };
      } else {
        console.info("[dsh-i18n] connection.rpc unavailable; dictionary + convert only (no LLM auto-translate)");
      }

      activateIfPreferred();
      syncDocumentLocale(locale.getLocale().active);
      try { window.setTimeout(() => syncDocumentLocale(locale.getLocale().active), 500); } catch { /* 忽略 */ }
      console.info("[dsh-i18n] ready; active=", locale.getLocale().active, "languages=", LANGUAGES.length);
    }

    module.exports = { name, inject, apply };
    return module.exports;
  },
});
`;

fs.mkdirSync(path.join(root, "lib"), { recursive: true });
fs.writeFileSync(outFile, clientJs, "utf8");
console.log("wrote", outFile, `(${clientJs.length} bytes)`);
