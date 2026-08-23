# dsh-multi-lang-ui

A sustainable internationalization plugin for the DeepSeek Harness Web UI. Version 0.2.0 registers 20 locales from one registry while preserving DSH's existing client ModuleLoader integration, locale service, preference migration, and runtime fallback behavior.

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, and Svenska.

Traditional Chinese locales fall back from the built-in Simplified Chinese dictionaries through the existing character converter. Arabic sets the document language and direction to `ar` / `rtl`; other managed locales use `ltr`. Untranslated non-Chinese values fall back to English.

## Install

Install into the profile your host actually boots, and pin the commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-multi-lang-ui#<commit>
```

For DSH Desktop the active profile is the `active` value in
`%APPDATA%/DSH Desktop/profile-selection/state.json` (usually `desktop`). The per-profile shim
`host-commands/<profile>/bin/dsh.cmd` bakes its own profile name into the command, so running the
`web` shim installs into the `web` profile even while Desktop is showing `desktop` — the install
succeeds and the plugin is never loaded. Pass `--profile` explicitly to be sure.

DSH Desktop's Market install paths accept only an exact published npm version, so a GitHub spec must
go through the built-in terminal `dsh plugin add`, which forwards the specifier to pnpm unvalidated.

Restart the host, then choose a language in **Settings → General → Language**. Remove with
`dsh plugin --profile <active-profile> remove dsh-multi-lang-ui`.

## Maintenance pipeline

The locale registry is `scripts/locales.mjs`. Translation data remains in `src/<locale>/`; generated browser code is `lib/client.js`.

```bash
npm run i18n:check   # file, namespace/key, stale, placeholder, and empty parity
npm run i18n:build   # assemble registry locales into lib/client.js
npm test             # check, build, and converter verification

node scripts/extract.mjs <installed-dsh-path>
```

Extraction accepts an installed DSH root, its `@deepseek-ai` package directory, or the unpacked desktop application path. It exits with an error if packages are missing or the installed bundle format cannot be extracted. Extraction updates the English and Simplified Chinese baselines; translations must then be synchronized before `i18n:check` passes.

## Publishing

The npm package includes runtime entries, the generated client, locale data, and the locale registry. Source repository: https://github.com/mimateinn/dsh-multi-lang-ui

## Security and privacy

The plugin has no runtime dependencies, network calls, telemetry, or filesystem access. It stores only the selected locale id in browser localStorage.

## License

MIT
