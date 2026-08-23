# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Een duurzame internationalisatie-plugin voor de DeepSeek Harness Web UI. Versie 0.2.0 registreert **20 locales** vanuit één registry, terwijl DSH's bestaande client-ModuleLoader-integratie, locale-service, voorkeursmigratie en runtime-fallbackgedrag behouden blijven.

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, en Svenska.

- De traditioneel-Chinese locales (zh-HK, zh-TW) vallen terug op de ingebouwde vereenvoudigd-Chinese woordenboeken via de bestaande tekenomzetter.
- Arabisch stelt de documenttaal en -richting in op `ar` / `rtl`; andere beheerde locales gebruiken `ltr`.
- Niet-vertaalde niet-Chinese waarden vallen terug op het Engels.

## Kenmerken

- Voegt alle 20 locales toe aan **Settings → General → Language**, naast de ingebouwde 中文 / English.
- Per taal handmatig verfijnde vertalingen voor elke officiële locale-naamruimte (715 strings elk), vanuit een Engelse basis.
- Runtime-fallback: nieuwe/bijgewerkte/third-party strings vallen terug op het Engels (of vereenvoudigd→traditioneel-conversie voor zh-HK/zh-TW), zodat upstream UI-updates en andere plugins gedekt zijn zonder elke taal opnieuw te vertalen.
- Taalvoorkeur wordt opgeslagen in de browser-`localStorage`; bestand tegen herladen.
- **Automatische vertaling**: wanneer een niet-Chinese locale actief is, wordt lange Engelse tekst (beschrijvingen op de pluginmarkt, UI van derden, fouttekst) automatisch naar jouw taal vertaald via je geconfigureerde model — gecachet en idempotent, zodat React-re-renders er niet mee vechten. De standaardtaal (en/zh) blijft onaangeroerd; traditioneel Chinees behoudt de ingebouwde vereenvoudigd→traditioneel-conversie in plaats van een model aan te roepen.
- Nul intrusie: pure client-plugin, geen wijzigingen aan upstream-pakketten, stille degradatie als de locale-service ontbreekt.

## Installeren

Installeer in het profiel dat je host daadwerkelijk opstart, en pin de commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Voor DSH Desktop is het actieve profiel de `active`-waarde in `%APPDATA%/DSH Desktop/profile-selection/state.json` (meestal `desktop`). De per-profiel-shim `host-commands/<profile>/bin/dsh.cmd` bakt zijn eigen profielnaam in de opdracht, dus het uitvoeren van de `web`-shim installeert in het `web`-profiel, zelfs terwijl Desktop `desktop` toont — de installatie slaagt en de plugin wordt nooit geladen. Geef `--profile` expliciet op om zeker te zijn.

De Market-installatiepaden van DSH Desktop accepteren alleen een exacte gepubliceerde npm-versie, dus een GitHub-spec moet via de ingebouwde terminal `dsh plugin add`, die de specifier ongevalideerd doorstuurt naar pnpm.

Herstart de host en kies vervolgens een taal in **Settings → General → Language**. Verwijderen met `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Onderhoudspipeline

De locale-registry is `scripts/locales.mjs`. Vertaaldata blijft in `src/<locale>/`; gegenereerde browsercode is `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Extractie accepteert een geïnstalleerde DSH-root, zijn `@deepseek-ai`-pakketmap, of het uitgepakte desktopapplicatiepad.

## Publiceren

Het npm-pakket bevat runtime-entries, de gegenereerde client, locale-data en de locale-registry. Bronrepository: https://github.com/mimateinn/dsh-i18n

## Beveiliging en privacy

- De plugin doet zelf geen netwerkoproepen, heeft geen telemetrie en leest/schrijft alleen twee browser-localStorage-sleutels: de geselecteerde locale-id en de vertaalmodel-overschrijving.
- Automatische vertaling loopt via DSH's ingebouwde LLM-service (je geconfigureerde model), niet via een API van derden. Het vuurt alleen voor lange Engelse tekst wanneer een niet-Chinese locale actief is; de standaardtaal wordt nooit ter vertaling verstuurd.
- Geen bestandssysteemtoegang, geen verwerking van inloggegevens.

## Licentie

MIT
