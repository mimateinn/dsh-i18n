// assemble.mjs — 从 src/<lang>/*.json 生成 lib/client.js（内嵌全部语言字典 + 插件逻辑）
// 用法: node scripts/assemble.mjs
import fs from "node:fs";
import path from "node:path";
import { locales } from "./locales.mjs";

const root = path.join(import.meta.dirname, "..");
const outFile = path.join(root, "lib", "client.js");

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
  id: "dsh-i18n",
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

    const name = "multi-lang-ui";
    const inject = [];

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
    const DOM_SKIP_SELECTOR = "input, textarea, select, [contenteditable], pre, code, script, style";
    const domConverted = new WeakMap(); // Text -> 原始字符串
    let domObserver = null;
    let domOriginalLang = null;

    function domShouldSkip(node) {
      let el = node.parentElement;
      while (el) {
        if (el.matches && el.matches(DOM_SKIP_SELECTOR)) return true;
        el = el.parentElement;
      }
      return false;
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
    function domWalk(root, fn) {
      if (root.nodeType === 3) { fn(root); return; }
      if (root.nodeType !== 1) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) fn(n);
    }
    function startDomConversion() {
      if (domObserver) return;
      try {
        domOriginalLang = domOriginalLang ?? document.documentElement.lang;
        document.documentElement.lang = "zh-TW";
      } catch { /* 忽略 */ }
      domWalk(document.body, domConvertText);
      domObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "characterData") domConvertText(m.target);
          else if (m.type === "childList") {
            for (const added of m.addedNodes) {
              if (added.nodeType === 3) domConvertText(added);
              else if (added.nodeType === 1) domWalk(added, domConvertText);
            }
          }
        }
      });
      domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    function stopDomConversion() {
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
      if (lang?.useConvert) startDomConversion();
      else stopDomConversion();
      try {
        document.documentElement.lang = lang?.id ?? document.documentElement.lang;
        document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
      } catch { /* document may not be ready */ }
    }

    function apply(ctx) {
      const locale = ctx.get("locale");
      if (!locale || typeof locale.register !== "function" || typeof locale.getLocale !== "function") {
        console.warn("[dsh-i18n] locale 服务不可用，插件静默降级");
        return;
      }

      // 1) 注册各语言字典（单 locale 形态；重复注册会抛错，逐个 try）
      for (const [langId, perNs] of Object.entries(DICTS)) {
        for (const [ns, dict] of Object.entries(perNs)) {
          try {
            ctx.effect(() => locale.register(ns, langId, dict), "dsh-i18n: " + langId + "/" + ns);
          } catch (error) {
            console.error("[dsh-i18n] register", langId, ns, error);
          }
        }
      }

      // 1.5) 包装 translate：我们语言的 active 时——先取精译（curated）；缺则：
      //      zh-TW 用 zh 值单字转繁；其他语言 fallback 英文（en 字典官方齐备）。
      const originalTranslate = locale.translate.bind(locale);
      locale.translate = (ns, key, params) => {
        const active = locale.getLocale().active;
        const lang = LANGUAGES.find((l) => l.id === active);
        if (lang === undefined) return originalTranslate(ns, key, params);
        const dicts = locale.dicts;
        const curated =
          dicts.get(ns)?.get(active)?.[key] ??
          (ns !== "common" ? dicts.get("common")?.get(active)?.[key] : undefined);
        if (curated !== undefined) return applyParams(curated, params);
        const fallbackLang = lang.useConvert ? "zh" : "en";
        const fallback =
          dicts.get(ns)?.get(fallbackLang)?.[key] ??
          (ns !== "common" ? dicts.get("common")?.get(fallbackLang)?.[key] : undefined);
        if (fallback !== undefined) {
          const value = lang.useConvert ? convertZhTw(fallback) : fallback;
          return applyParams(value, params);
        }
        return key;
      };

      // 2) 把全部语言加入可选语言列表：patch snapshot，再 publish 一次让设置页
      //    语言行（读取 locale/change 事件）刷新出选项。
      const snapshot = locale.getLocale();
      const locales = [...snapshot.locales];
      for (const lang of LANGUAGES) {
        if (!locales.some((l) => l.id === lang.id)) {
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

      // 3) 包装 setLocale：我们语言的 id 走自有路径，其余（zh/en）走原逻辑并清除偏好
      const isOurs = (id) => LANGUAGES.some((l) => l.id === id);
      const originalSetLocale = locale.setLocale.bind(locale);
      locale.setLocale = (id) => {
        if (isOurs(id)) {
          locale.publish(id, true);
          writePref(id);
        } else {
          originalSetLocale(id);
          writePref(null);
        }
        syncDocumentLocale(locale.getLocale().active);
      };

      // 4) 持久化：启动时若 localStorage 有我们的语言偏好则自动启用。
      //    注意：内置 dsh-client-locale 的 host 偏好是异步载入的——它在构造后
      //    才收到 settings 文档，随即 adopt() 用 locale.preference ?? provisional
      //    重置 active（provisional 对 zh 系浏览器是 "zh"），会盖掉我们启动时的
      //    启用。因此除启动时立即启用外，还要包一层 adopt()：每次内置 re-adopt
      //    后若我们的偏好仍在我们的语言里，就重新断言。
      const activateIfPreferred = () => {
        const pref = readPref();
        if (pref !== null && isOurs(pref) && locale.getLocale().active !== pref) {
          try { locale.publish(pref, true); } catch (error) { /* 忽略 */ }
        }
      };
      if (typeof locale.adopt === "function") {
        const originalAdopt = locale.adopt.bind(locale);
        locale.adopt = (host) => {
          originalAdopt(host);
          activateIfPreferred();
          syncDocumentLocale(locale.getLocale().active);
        };
      }
      activateIfPreferred();
      syncDocumentLocale(locale.getLocale().active);
      // 启动后 DOM 可能未渲染完，延后几拍再补一轮兜底转换
      try { window.setTimeout(() => syncDocumentLocale(locale.getLocale().active), 500); } catch { /* 忽略 */ }
    }

    module.exports = { name, inject, apply };
    return module.exports;
  },
});
`;

fs.mkdirSync(path.join(root, "lib"), { recursive: true });
fs.writeFileSync(outFile, clientJs, "utf8");
console.log("wrote", outFile, `(${clientJs.length} bytes)`);
