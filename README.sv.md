# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Ett hållbart internationaliseringsplugin för DeepSeek Harness webbgränssnitt. Version 0.2.0 registrerar **20 språkversioner** från ett register samtidigt som DSH:s befintliga klientintegrering med ModuleLoader, språktjänst, preferensmigrering och runtime-fallback-beteende bevaras.

## Språk

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย och Svenska.

- Traditionella kinesiska språkversioner (zh-HK, zh-TW) faller tillbaka på de inbyggda förenklade kinesiska ordlistorna via den befintliga teckenkonverteraren.
- Arabiska anger dokumentets språk och riktning till `ar` / `rtl`; övriga hanterade språkversioner använder `ltr`.
- Oöversatta icke-kinesiska värden faller tillbaka på engelska.

## Funktioner

- Lägger till alla 20 språkversioner i **Settings → General → Language**, vid sidan av de inbyggda 中文 / English.
- Handslipade översättningar per språk för varje officiell språknamespace (715 strängar vardera), utifrån en engelsk baslinje.
- Runtime-fallback: nya/uppdaterade/tredjepartssträngar faller tillbaka på engelska (eller förenklad→traditionell konvertering för zh-HK/zh-TW), så att uppströms UI-uppdateringar och andra plugins täcks utan att varje språk översätts på nytt.
- Språkpreferensen sparas i webbläsarens `localStorage`; överlever omladdning.
- Noll intrång: rent klientplugin, inga ändringar av uppströms paket, tyst degradering om språktjänsten saknas.

## Installation

Installera i den profil din värd faktiskt startar, och lås fast commiten:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

För DSH Desktop är den aktiva profilen värdet `active` i
`%APPDATA%/DSH Desktop/profile-selection/state.json` (vanligtvis `desktop`). Den profilspecifika shimen
`host-commands/<profile>/bin/dsh.cmd` bakar in sitt eget profilnamn i kommandot, så att körning av
`web`-shimen installerar i profilen `web` även medan Desktop visar `desktop` — installationen
lyckas och plugin:et aldrig laddas. Ange `--profile` uttryckligen för att vara säker.

DSH Desktops Market-installationsvägar accepterar bara en exakt publicerad npm-version, så en GitHub-specifikation måste
gå via den inbyggda terminalen `dsh plugin add`, som vidarebefordrar specifikationen till pnpm utan validering.

Starta om värden och välj sedan ett språk i **Settings → General → Language**. Ta bort med
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## Underhållspipeline

Språkregistret är `scripts/locales.mjs`. Översättningsdata finns kvar i `src/<locale>/`; genererad webbläsarkod är `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Extrahering accepterar en installerad DSH-rot, dess `@deepseek-ai`-pakkatalog eller den uppackade skrivbordsapplikationens sökväg.

## Publicering

npm-paketet innehåller runtime-poster, den genererade klienten, språkdata och språkregistret. Källkodsrepo: https://github.com/mimateinn/dsh-i18n

## Säkerhet och integritet

Plugin:et har inga runtime-beroenden, nätverksanrop, telemetri eller filsystemåtkomst. Det lagrar endast det valda språk-id:t i webbläsarens localStorage.

## Licens

MIT
