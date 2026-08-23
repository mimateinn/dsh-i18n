# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

一個可持續發展的國際化外掛，用於 DeepSeek Harness Web UI。0.2.0 版會從單一登錄檔註冊 **20 個語系**，同時保留 DSH 既有的用戶端 ModuleLoader 整合、語系服務、偏好設定遷移，以及執行時期回退行為。

## 語系

繁體中文（香港、台灣）、日本語、한국어、Français、Deutsch、Español、Português (Brasil)、Italiano、Русский、Українська、Polski、Nederlands、Türkçe、العربية、हिन्दी、Bahasa Indonesia、Tiếng Việt、ไทย，以及 Svenska。

- 繁體中文語系（zh-HK、zh-TW）會透過現有的字元轉換器，從內建的簡體中文辭典進行回退。
- 阿拉伯文會將文件語言與方向設定為 `ar` / `rtl`；其他受管理的語系則使用 `ltr`。
- 未翻譯的非中文值會回退為英文。

## 功能

- 將全部 20 個語系新增至 **Settings → General → Language**，與內建的 中文 / English 並列。
- 以英文為基準，為每個官方語系命名空間提供逐一人工潤飾的翻譯（各 715 條字串）。
- 執行時期回退：新增／更新／第三方字串會回退為英文（或針對 zh-HK／zh-TW 進行簡體轉繁體），因此無須重新翻譯每個語言，即可涵蓋上游 UI 更新與其他外掛。
- 語言偏好設定會儲存在瀏覽器的 `localStorage` 中；重新載入後仍然有效。
- **沉浸式翻譯**：當啟用的是非中文語系時，長英文文字（外掛市場描述、第三方 UI、錯誤訊息）會透過你正在使用的模型自動翻譯成你的語言——具備快取與冪等性，React 重新渲染不會反覆覆寫。預設語言（en／zh）不翻譯；繁體中文繼續使用內建簡→繁轉換，不呼叫模型。
- 字典零侵入：不修改任何上游套件；缺少語系服務時會靜默降級。

## 安裝

請安裝到主程式實際啟動所使用的 profile，並固定（pin）特定的 commit：

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

就 DSH Desktop 而言，作用中的 profile 是下列檔案中的 `active` 值：
`%APPDATA%/DSH Desktop/profile-selection/state.json`（通常是 `desktop`）。每個 profile 各自的 shim
`host-commands/<profile>/bin/dsh.cmd` 會將自己的 profile 名稱寫入指令中，因此執行
`web` shim 時會安裝到 `web` profile，即使 Desktop 顯示的是 `desktop` —— 安裝
會成功，但外掛永遠不會被載入。請明確加上 `--profile` 以確保正確。

DSH Desktop 的 Market 安裝路徑只接受已發佈的精確 npm 版本，因此 GitHub 規格（spec）必須
透過內建終端機的 `dsh plugin add` 進行，它會將 specifier 原封不動地轉交給 pnpm。

重新啟動主程式，然後在 **Settings → General → Language** 中選擇語言。移除時使用
`dsh plugin --profile <active-profile> remove dsh-i18n`。

## 維護流程

語系登錄檔位於 `scripts/locales.mjs`。翻譯資料保存在 `src/<locale>/`；產生的瀏覽器程式碼為 `lib/client.js`。

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Extraction 可接受已安裝的 DSH 根目錄、其 `@deepseek-ai` 套件目錄，或已解包的桌面應用程式路徑。

## 發佈

npm 套件包含執行時期項目、產生的用戶端、語系資料以及語系登錄檔。原始碼儲存庫：https://github.com/mimateinn/dsh-i18n

## 安全性與隱私

- 此外掛本身不發起任何網路請求、沒有遙測，只會讀寫兩個瀏覽器 localStorage 鍵：所選的語系 id 與翻譯模型覆寫。
- 沉浸式翻譯透過 DSH 內建的 LLM 服務（你正在使用的模型）執行，而非第三方 API。只有在非中文語系啟用時，才會對長英文散文觸發；預設語言永遠不會被送出翻譯。
- 不觸碰檔案系統、不處理憑證。

## 授權

MIT
