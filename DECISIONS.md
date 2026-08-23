> 讀法：做 i18n pipeline 先讀 ｜ 內容：架構決定與取捨 ｜ 上限：30KB

# DECISIONS

## 2026-08-24 — The gate must check content, not only structure

**Decision:** `scripts/check.mjs` also fails on (a) a value byte-identical to English that still contains at least
3 English words after stripping placeholders, slash commands, file names and a literal-term whitelist, and
(b) any Simplified character (keys of `src/zh-tw-parts/chars.json`) appearing in a `traditional` locale.

**Why:** an independent review found the structural-only gate reported `i18n check passed: 20 locales × 28 files`
while `nl`/`tr`/`id`/`th` shipped 65–100 untranslated English sentences each, and both Traditional locales
shipped 占 instead of 佔. A green gate that cannot fail on the plugin's actual purpose certifies nothing.

**Why a word threshold rather than plain equality:** plain equality produces false positives on legitimate values —
pure format strings (`{y}-{m}-{d}`, `{tps} tok/s`), retained proper nouns (DSH, JSON, Cordis), and single words
that genuinely coincide (Polish "Model", Swedish "Standard mode"). The 3-word threshold catches English prose
without punishing correct translations.

**Why the Simplified check cannot be delegated to `verify-converter.mjs`:** the runtime applies `convertZhTw`
only on the fallback branch (`lib/client.js`, `const fallbackLang = lang.useConvert ? "zh" : "en"`). A curated
value is returned as-is, so Simplified residue in curated data reaches the UI while the converter test stays green.

**Not chosen:** a language-detection library or a translation-quality metric — non-deterministic, and a gate that
cannot be reproduced offline is not a gate.

## 2026-08-24 — Install path: terminal `dsh plugin add` with a pinned github spec

**Decision:** the fork is installed into the **active** DSH Desktop profile with
`dsh plugin --profile <active> add github:mimateinn/dsh-multi-lang-ui#<commit>`, not through the Market UI.

**Why (verified against DSH Desktop 2.0.2 code, read-only audit 2026-08-24):** the three install paths enforce different version rules.
- Community Market (`dsh-community-market/lib/install/service.js`): exact **stable** semver only — `stableExactVersion()` rejects prereleases; `observeCatalog` skips any item whose `package.registry !== 'npm'`; `install/manual.js` deliberately refuses to even print a GitHub install command.
- dsh-market (`dshmarket/lib/dsh-cli.js` `desktopInstallIdentity`, plus the Host boundary `app.asar.unpacked/lib/pnpm.js` `NPM_EXACT_VERSION_PATTERN`): exact published npm version (prerelease allowed); a `github:owner/repo#sha` spec fails the name regex → `dsh-market: DSH Desktop managed installation requires an npm package with an exact published version`.
- Built-in terminal shim `host-commands/<profile>/bin/dsh.cmd` → `lib/desktop-cli.js`: **no specifier validation at all** — argv is forwarded to pnpm, so `github:...#<commit>` is accepted. The installed `dshmarket` dependency itself is a github pin, which proves this path.

Since `dsh-multi-lang-ui` is not published on npm (registry returns 404) and no npm identity is authenticated on this machine, the two Market paths are structurally unavailable. Publishing stays a later step; it does not block installation.

**Not chosen:** loosening Desktop's managed-install policy, or publishing a placeholder version to npm just to satisfy the Market path.

## 2026-08-24 — Install into the profile Desktop actually boots

**Decision:** target the profile named in `%APPDATA%/DSH Desktop/profile-selection/state.json` (`active`, after `pending`/`lastKnownGood` resolution), currently `desktop`.

**Why:** each shim hard-codes its profile (`DSH_DESKTOP_DEFAULT_PROFILE`) and `withDefaultDesktopProfile()` injects it into `plugin` argv, so `host-commands/web/bin/dsh.cmd plugin add` mutates `~/.dsh/profiles/web` even while Desktop is running `desktop` — the plugin installs successfully and is never loaded. That is exactly the earlier symptom (v0.1.0 sitting in the `web` profile).

**Consequence:** both shims share one install-recovery WAL (`plugin-install-recovery/state.json`). A terminal install under a non-active profile leaves a WAL bound to that profile, and the next start logs `deferred plugin install recovery (profile-mismatch) for manual-plugin-install`; the transaction is never finalised and blocks every later managed install until Desktop next boots with that same profile active. Installing under the active profile avoids this entirely.

## 2026-08-19 — One locale registry

**Decision:** `scripts/locales.mjs` is the single source for locale id, source directory, display label, Traditional fallback, and RTL metadata.

**Why:** validation and assembly cannot drift onto different locale lists. A registered locale with incomplete files fails loudly.

**Not chosen:** silently assembling only directories that happen to exist, because that makes advertised coverage nondeterministic.

## 2026-08-19 — Preserve the DSH loader contract

**Decision:** generation retains the existing `window.__ModuleLoader__.load` CJS factory and wraps the existing locale runtime rather than replacing it.

**Why:** this preserves plugin loading, built-in locale handling, preference adoption, and graceful degradation.

## 2026-08-19 — Runtime fallbacks

**Decision:** zh-HK and zh-TW use the existing Simplified-to-Traditional converter; other missing translations use English. Arabic owns document `rtl` while active and managed non-Arabic locales restore `ltr`.