# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Ein nachhaltiges Internationalisierungs-Plugin für die DeepSeek Harness Web UI. Version 0.2.0 registriert **20 Locales** aus einer zentralen Registry und erhält dabei DSHs bestehende Client-ModuleLoader-Integration, den Locale-Dienst, die Präferenz-Migration und das Runtime-Fallback-Verhalten.

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, und Svenska.

- Traditionelle chinesische Locales (zh-HK, zh-TW) fallen über den vorhandenen Zeichenkonverter auf die integrierten Wörterbücher für vereinfachtes Chinesisch zurück.
- Arabisch setzt Dokument-Sprache und -Richtung auf `ar` / `rtl`; andere verwaltete Locales verwenden `ltr`.
- Nicht übersetzte, nicht-chinesische Werte fallen auf Englisch zurück.

## Funktionen

- Fügt alle 20 Locales zu **Settings → General → Language** hinzu, neben dem integrierten 中文 / English.
- Handgepflegte, sprachspezifische Übersetzungen für jeden offiziellen Locale-Namespace (je 715 Zeichenketten), ausgehend von einer englischen Basis.
- Runtime-Fallback: neue, aktualisierte oder von Drittanbietern stammende Zeichenketten fallen auf Englisch zurück (bzw. auf die Konvertierung von vereinfachtem zu traditionellem Chinesisch für zh-HK/zh-TW), sodass Upstream-UI-Updates und andere Plugins abgedeckt sind, ohne jede Sprache neu zu übersetzen.
- Die Sprachpräferenz wird im Browser-`localStorage` gespeichert und übersteht ein Neuladen.
- Kein Eingriff: reines Client-Plugin, keine Änderungen an Upstream-Paketen, stille Degradierung, falls der Locale-Dienst fehlt.

## Installation

Installiere in das Profil, das dein Host tatsächlich startet, und pinne den Commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Für DSH Desktop ist das aktive Profil der Wert `active` in `%APPDATA%/DSH Desktop/profile-selection/state.json` (üblicherweise `desktop`). Der profilbezogene Shim `host-commands/<profile>/bin/dsh.cmd` backt seinen eigenen Profilnamen fest in den Befehl ein, sodass das Ausführen des `web`-Shims die Installation in das `web`-Profil vornimmt, selbst wenn Desktop gerade `desktop` anzeigt — die Installation gelingt, aber das Plugin wird nie geladen. Gib `--profile` explizit an, um sicherzugehen.

Die Market-Installationspfade von DSH Desktop akzeptieren nur eine exakte veröffentlichte npm-Version; daher muss eine GitHub-Angabe über das integrierte Terminal `dsh plugin add` laufen, das die Angabe ungeprüft an pnpm weiterreicht.

Starte den Host neu und wähle anschließend eine Sprache unter **Settings → General → Language**. Entferne das Plugin mit `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Wartungs-Pipeline

Die Locale-Registry ist `scripts/locales.mjs`. Die Übersetzungsdaten liegen in `src/<locale>/`; der generierte Browser-Code ist `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Die Extraktion akzeptiert ein installiertes DSH-Stammverzeichnis, dessen `@deepseek-ai`-Paketverzeichnis oder den Pfad zur entpackten Desktop-Anwendung.

## Veröffentlichung

Das npm-Paket enthält Laufzeit-Einträge, den generierten Client, die Locale-Daten und die Locale-Registry. Quell-Repository: https://github.com/mimateinn/dsh-i18n

## Sicherheit und Datenschutz

Das Plugin hat keine Laufzeit-Abhängigkeiten, Netzwerkaufrufe, Telemetrie oder Dateisystemzugriffe. Es speichert nur die gewählte Locale-ID im Browser-localStorage.

## Lizenz

MIT
