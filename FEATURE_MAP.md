> 讀法：揀嘢前查 ｜ 內容：功能到檔案對位 ｜ 上限：30KB

# FEATURE_MAP

| Capability | Source of truth | Generated/runtime output | Gate |
|---|---|---|---|
| Supported locales and metadata | `scripts/locales.mjs` | `lib/client.js` language list | `scripts/check.mjs` |
| Translation dictionaries | `src/en`, `src/<locale>` | `lib/client.js` DICTS | `npm run i18n:check` |
| Upstream extraction | Installed DSH client bundles | `src/en`, `src/zh-src` | Extractor fails on missing/changed bundles |
| Traditional fallback | `src/zh-tw-parts/chars.json` | Runtime converter for zh-HK/zh-TW | `verify-converter.mjs` |
| Arabic direction | Locale registry `rtl` flag | Document `lang` and `dir` | Generated client behavior |
| Untranslated-English detection | `scripts/check.mjs` `englishWordCount` | — | `npm run i18n:check` |
| Simplified residue in zh-HK/zh-TW | `src/zh-tw-parts/chars.json` keys | — | `npm run i18n:check` |
| Package release metadata | `package.json` | npm/GitHub metadata | `npm test` |
