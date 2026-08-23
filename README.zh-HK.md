# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

一個可持續嘅 DeepSeek Harness Web UI 國際化插件。版本 0.2.0 從單一註冊表註冊 **20 個地區語言**，同時保留 DSH 現有嘅客戶端 ModuleLoader 整合、地區語言服務、偏好遷移同埋執行期回退行為。

## 地區語言

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, and Svenska.

- 繁體中文地區語言（zh-HK、zh-TW）透過現有嘅字元轉換器，由內建嘅簡體中文字典回退。
- 阿拉伯文會將文件語言同方向設為 `ar` / `rtl`；其他受管理嘅地區語言使用 `ltr`。
- 未翻譯嘅非中文數值會回退到英文。

## 功能

- 將全部 20 個地區語言加入 **Settings → General → Language**，同內建嘅 中文 / English 並列。
- 每個官方地區語言命名空間（各 715 條字串）都有按語言逐句打磨嘅翻譯，以英文為基準。
- 執行期回退：新增／更新／第三方字串會回退到英文（或對 zh-HK／zh-TW 進行簡體→繁體轉換），因此上游 UI 更新同其他插件都被覆蓋，唔需要逐種語言重新翻譯。
- 語言偏好會儲存喺瀏覽器 `localStorage`；重新載入後依然有效。
- **自動翻譯**：當啟動嘅係非中文語言時，長英文文字（插件市場描述、第三方 UI、錯誤訊息）會經你用緊嘅模型自動翻譯成你嘅語言，而且有快取，重新渲染唔會反覆覆寫。預設語言（en／zh）唔翻譯；繁體中文繼續用內置簡→繁轉換，唔使叫模型。
- 字典零侵入：唔改動上游套件，地區語言服務缺失時靜默降級。

## 安裝

由 npm 安裝（精確版本——DSH Desktop 嘅 Market「更新」按鈕需要呢個）：

```bash
dsh plugin --profile <active-profile> add @mimateinn/dsh-i18n@0.2.0
```

或者由 GitHub 安裝，固定 commit：

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

對 DSH Desktop 嚟講，作用中設定檔係 `%APPDATA%/DSH Desktop/profile-selection/state.json` 入面嘅 `active` 值（通常係 `desktop`）。每個設定檔嘅 shim `host-commands/<profile>/bin/dsh.cmd` 會將自己嘅設定檔名稱寫入命令，所以即使 Desktop 顯示緊 `desktop`，執行 `web` shim 都會安裝到 `web` 設定檔——安裝會成功，但插件永遠唔會被載入。請明確傳入 `--profile` 以確保無誤。

DSH Desktop 嘅 Market 安裝路徑只接受精確嘅已發佈 npm 版本，因此 GitHub 指定格式必須經內建終端機 `dsh plugin add`，佢會將指定符原樣轉交俾 pnpm，唔做驗證。

重新啟動主機，然後喺 **Settings → General → Language** 揀選語言。用 `dsh plugin --profile <active-profile> remove dsh-i18n` 移除。

## 維護流程

地區語言註冊表係 `scripts/locales.mjs`。翻譯資料存放喺 `src/<locale>/`；生成嘅瀏覽器程式碼係 `lib/client.js`。

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

擷取接受已安裝嘅 DSH 根目錄、其 `@deepseek-ai` 套件目錄，或者已解壓嘅桌面應用程式路徑。

## 發佈

npm 套件包含執行期項目、生成嘅客戶端、地區語言資料同埋地區語言註冊表。原始碼儲存庫：https://github.com/mimateinn/dsh-i18n

## 安全同私隱

- 插件本身唔發任何網路請求、冇遙測，只讀寫兩個瀏覽器 localStorage key：所選嘅地區語言 id 同翻譯模型覆寫。
- 自動翻譯經 DSH 內置 LLM 服務（你用緊嘅模型）執行，唔經第三方 API。只喺非中文語言啟動時、對長英文散文觸發；預設語言永遠唔會送出去翻譯。
- 唔掂檔案系統、唔碰 credential。

## 授權

MIT
