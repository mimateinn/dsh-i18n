# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

A sustainable internationalization plugin for the DeepSeek Harness Web UI. Version 0.2.0 registers **20 locales** from one registry while preserving DSH's existing client ModuleLoader integration, locale service, preference migration, and runtime fallback behavior.

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, and Svenska.

- Traditional Chinese locales (zh-HK, zh-TW) fall back from the built-in Simplified Chinese dictionaries through the existing character converter.
- Arabic sets the document language and direction to `ar` / `rtl`; other managed locales use `ltr`.
- Untranslated non-Chinese values fall back to English.

## Features

- Adds all 20 locales to **Settings → General → Language**, alongside the built-in 中文 / English.
- Per-language hand-polished translations for every official locale namespace (715 strings each), from an English baseline.
- Runtime fallback: new/updated/third-party strings fall back to English (or Simplified→Traditional conversion for zh-HK/zh-TW), so upstream UI updates and other plugins are covered without re-translating every language.
- Language preference persisted in browser `localStorage`; reload-proof.
- **Auto-translate**: with a non-Chinese locale active, long English text (plugin-market descriptions, third-party UI, error prose) is auto-translated to your language through your configured model, and cached so re-renders don't undo it. The default language (en/zh) is left untouched; Traditional Chinese keeps the built-in Simplified→Traditional conversion instead of calling a model.
- Zero intrusion on dictionaries: no upstream package changes, silent degradation if the locale service is missing.

## Install

Install into the profile your host actually boots, and pin the commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

For DSH Desktop the active profile is the `active` value in
`%APPDATA%/DSH Desktop/profile-selection/state.json` (usually `desktop`). The per-profile shim
`host-commands/<profile>/bin/dsh.cmd` bakes its own profile name into the command, so running the
`web` shim installs into the `web` profile even while Desktop is showing `desktop` — the install
succeeds and the plugin is never loaded. Pass `--profile` explicitly to be sure.

DSH Desktop's Market install paths accept only an exact published npm version, so a GitHub spec must
go through the built-in terminal `dsh plugin add`, which forwards the specifier to pnpm unvalidated.

Restart the host, then choose a language in **Settings → General → Language**. Remove with
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## Maintenance pipeline

The locale registry is `scripts/locales.mjs`. Translation data remains in `src/<locale>/`; generated browser code is `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Extraction accepts an installed DSH root, its `@deepseek-ai` package directory, or the unpacked desktop application path.

## Publishing

The npm package includes runtime entries, the generated client, locale data, and the locale registry. Source repository: https://github.com/mimateinn/dsh-i18n

## Security and privacy

- The plugin makes no network calls itself, has no telemetry, and reads/writes only two browser localStorage keys: the selected locale id and the translate-model override.
- Auto-translate runs through DSH's built-in LLM service (your configured model), not a third-party API. It only fires for long English prose when a non-Chinese locale is active; the default language is never sent for translation.
- No filesystem access, no credential handling.

## License

MIT
