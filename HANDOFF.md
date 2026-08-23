> 讀法：開工必讀 ｜ 內容：目前狀態、驗證與下一步 ｜ 上限：50KB

# HANDOFF

## 目前狀態
- 2026-08-19：20-locale registry pipeline implemented in scripts; client bundle is generated from registry.
- Owned scope only; src locale data was not edited.

## 驗證
- 2026-08-19 `npm test`: RED at `i18n:check` with 218 data-parity issues; build/converter stages did not run. This is expected to remain red until registry locale data is completed in `src/` (outside this task ownership).

## 下一步
- Complete missing locale files/translations under `src/` before release if parity check reports them.

## 文件地圖
| File | Read method | Purpose |
|---|---|---|
| HANDOFF.md | 開工必讀 | Current state and handoff |
| FEATURE_MAP.md | 揀嘢前查 | Feature-to-file ownership |
| DECISIONS.md | 做 i18n pipeline 先讀 | Durable design decisions |

## 中過嘅伏
- A registry entry is intentionally a release commitment: missing or stale locale files fail the gate instead of silently shipping partial coverage.

守門統計：本 session 守門紅 1 次；修正 validator crash 後重跑，資料 gate 正常報 218 項；無繞過。
