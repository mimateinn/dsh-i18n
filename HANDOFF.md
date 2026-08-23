> 讀法：開工必讀 ｜ 內容：目前狀態、驗證與下一步 ｜ 上限：50KB

# HANDOFF

## 進行中
（空）

## 目前狀態
- 2026-08-24：**安裝版本問題已解決**。20 個 locale 全部補齊，`npm test` 全綠，fork 已推上
  `mimateinn/dsh-multi-lang-ui`（HEAD `87b6b11`），並用 pinned commit 裝入 **active desktop profile**。
- 本 session 改咗：
  - `src/hi`、`src/pt-br`、`src/sv`、`src/uk`、`src/vi`、`src/pl` — 6 個全新語言，各 28 檔 / 715 key（sub-agent 翻譯）。
  - `src/ru` — 補 5 個缺檔 + 修 `conversation.ask.waiting` 空值。
  - `src/zh-hk`、`src/it`、`src/ar`、`src/id` — 補 `dsh-client-ui-reference.json`；zh-HK/it/ar 補 `command.notice.imagesUnsupported`。
  - `scripts/extract.mjs` — PKGS 加入 `dsh-client-ui-reference`（原本漏咗，所以該檔一直靠手寫）。
  - `README.md` — 安裝章節改為 pinned github commit + 明確 `--profile`，並寫明 Market 只收 exact npm 版本。
  - `DECISIONS.md` — 新增兩條安裝路徑決定（見下）。
  - `.gitignore` — 排除 `src/*/.mt/`、`src/*/.translate.py`、`translate_*.py`（本地 MT venv 203 MB，唔可以入 repo）。

## 版本問題嘅真正成因（已實證，唔好再考古）
之前「裝完冇效」係兩個獨立原因疊埋：
1. **裝錯 profile。** `host-commands/<profile>/bin/dsh.cmd` 將 profile 名寫死喺 `DSH_DESKTOP_DEFAULT_PROFILE`，
   `withDefaultDesktopProfile()` 會注入落 `plugin` argv。所以用 web shim 裝，會裝入 `~/.dsh/profiles/web`，
   而 Desktop 實際 boot 緊 `desktop` profile — 裝得成功但永遠唔會載入。舊 v0.1.0 就係困喺 web profile。
2. **Market 路徑收唔到 github spec。** 三條安裝路徑規則唔同（詳見 DECISIONS）：Community Market 只收
   exact **stable** npm 版本；dsh-market 收 exact npm 版本（容許 prerelease）；只有內置 terminal
   `dsh plugin add` 完全唔驗 specifier，直接交畀 pnpm。本 package 未上 npm（registry 404、本機亦無 npm 身份），
   所以只有 terminal 路徑可行。

## 驗證（2026-08-24 實跑）
- `npm test` **EXIT=0**：`i18n check passed: 20 locales × 28 files`；assemble 20 語言各 715 key；
  converter `converted 715 strings, 0 with residual simplified chars`。
- 重跑 assemble 後 `git status` 乾淨 ⇒ `lib/client.js` 可重現（795188 bytes）。
- 安裝落地：`~/.dsh/profiles/desktop/package.json` 依賴 = `github:mimateinn/dsh-multi-lang-ui#87b6b113...`，
  node_modules 內 version **0.2.0**（之前 web profile 嗰個係 0.1.0）。
- `dsh --profile desktop --dump-config` 已見 `- id: multi-lang-ui / name: dsh-multi-lang-ui`。
- 安裝檔 sha256 = repo `lib/client.js` sha256（6FC3D427…FF4F），`node --check` 通過。
- 對住已安裝 DSH Desktop 2.0.2 重抽 en 基準：**0 個 stale、0 個值改動**；有 **14 個 upstream 新 key** 未收（見下）。

## 下一步
- [ ] **重啟 DSH Desktop**（現時 WAL phase = `awaiting-restart`，profileName = `desktop`，同 active 一致，
      所以正常重啟會 finalize；唔重啟就會一直阻住之後所有 managed install）。重啟後喺
      **Settings → General → Language** 揀語言做 GUI 驗收。
- [ ] 收 14 個 upstream 新 key（`conversation.image.dimensionTooLarge`、`fileOpen.*`、`message.reference*`、
      `command.imagesUnsupported`、`directory-browser.browser.nativePicker`、`feedback.note.dialog`、
      `settings.models.fetchSelectAll/fetchDeselectAll`、`subagent.switcher.aria`、`trajectory.toolbar.thinking`），
      20 個語言都要補 ⇒ 715 → 729 key。
- [ ] npm 發佈仍然 blocked：`npm whoami` = ENEEDAUTH，`registry.npmjs.org/dsh-multi-lang-ui` 404。
      有 npm 身份先發，發咗之後 Market 路徑先會通。

## 獨立審查
- review ID: `d67b4e39`｜reviewer: sub-agent（read-only）｜frozen revision: `87b6b113e07af81765863d9fd738596874667405`
- scope: gate 完整性、英文殘留量化、簡體殘留、生成 bundle 結構安全、RTL/fallback 宣稱對唔對得上 code
- verdict: **PENDING**（本 session 未收到結果前唔准當通過）

## 文件地圖
| File | Read method | Purpose |
|---|---|---|
| HANDOFF.md | 開工必讀 | Current state and handoff |
| FEATURE_MAP.md | 揀嘢前查 | Feature-to-file ownership |
| DECISIONS.md | 做 i18n pipeline 或安裝問題先讀 | Durable design decisions |

## 中過嘅伏
- A registry entry is intentionally a release commitment: missing or stale locale files fail the gate instead of silently shipping partial coverage.
- **裝插件唔講 `--profile` = 賭博。** shim 自帶 profile，同 Desktop 實際 boot 嗰個可以唔同；裝成功 ≠ 會載入。
  永遠先睇 `%APPDATA%/DSH Desktop/profile-selection/state.json` 個 `active`，再明確 `--profile`。
- **install-recovery WAL 係全機一份**（`plugin-install-recovery/state.json`），唔係 per-profile。用非 active profile 嘅
  shim 裝嘢，會留低一個對唔上嘅 WAL，之後每次開機都 log `profile-mismatch`，而且**永遠阻住下一次 managed install**，
  又冇 UI 可以撤銷 — 唯一出路係用返 WAL 入面嗰個 profile 開機一次。
- **`scripts/extract.mjs` 嘅 PKGS 係手寫白名單。** 漏一個 package（今次係 `dsh-client-ui-reference`），
  抽取就會靜靜少一個檔，而 check.mjs 只同 `src/en` 比，所以完全唔會報。加新 upstream package 要記得手動加。
- **機器翻譯嘅 venv 唔好放 repo 入面。** `src/uk/.mt` 有 203 MB 兼有 permission denied 目錄，令 `git status` 洗版。

守門統計：本 session 守門紅 3 次（154 → 147 → 141 issue，最後 0），無卡關，無返工；獨立審查 PENDING。
