# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Un plugin di internazionalizzazione sostenibile per la Web UI di DeepSeek Harness. La versione 0.2.0 registra **20 lingue** da un unico registro, preservando l'integrazione esistente con il client ModuleLoader di DSH, il servizio di localizzazione, la migrazione delle preferenze e il comportamento di fallback a runtime.

## Lingue

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, e Svenska.

- Le lingue cinesi tradizionali (zh-HK, zh-TW) ricadono sui dizionari cinesi semplificati integrati tramite il convertitore di caratteri esistente.
- L'arabo imposta la lingua e la direzione del documento su `ar` / `rtl`; le altre lingue gestite usano `ltr`.
- I valori non tradotti e non cinesi ricadono sull'inglese.

## Funzionalità

- Aggiunge tutte le 20 lingue a **Settings → General → Language**, accanto alle lingue integrate 中文 / English.
- Traduzioni rifinite a mano per ogni lingua, per ogni namespace di locale ufficiale (715 stringhe ciascuno), a partire da una base inglese.
- Fallback a runtime: le stringhe nuove, aggiornate o di terze parti ricadono sull'inglese (o sulla conversione Semplificato→Tradizionale per zh-HK/zh-TW), così gli aggiornamenti dell'interfaccia upstream e gli altri plugin restano coperti senza dover ritradurre ogni lingua.
- La preferenza di lingua viene salvata nel `localStorage` del browser; resiste al ricaricamento.
- Zero intrusioni: plugin puramente client, nessuna modifica ai pacchetti upstream, degradazione silenziosa se il servizio di localizzazione manca.

## Installazione

Installa nel profilo che il tuo host avvia realmente, e fissa il commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Per DSH Desktop il profilo attivo è il valore `active` in
`%APPDATA%/DSH Desktop/profile-selection/state.json` (di solito `desktop`). Lo shim per profilo
`host-commands/<profile>/bin/dsh.cmd` incorpora il proprio nome di profilo nel comando, quindi eseguire lo
shim `web` installa nel profilo `web` anche mentre Desktop mostra `desktop` — l'installazione
riesce ma il plugin non viene mai caricato. Passa `--profile` esplicitamente per sicurezza.

I percorsi di installazione del Market di DSH Desktop accettano solo una versione npm pubblicata esatta, quindi una specifica GitHub deve
passare dal terminale integrato `dsh plugin add`, che inoltra lo specificatore a pnpm senza validazione.

Riavvia l'host, quindi scegli una lingua in **Settings → General → Language**. Rimuovi con
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## Pipeline di manutenzione

Il registro delle lingue è `scripts/locales.mjs`. I dati di traduzione restano in `src/<locale>/`; il codice browser generato è `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

L'estrazione accetta una root DSH installata, la sua directory del pacchetto `@deepseek-ai`, oppure il percorso dell'applicazione desktop decompressa.

## Pubblicazione

Il pacchetto npm include le voci runtime, il client generato, i dati di locale e il registro delle lingue. Repository sorgente: https://github.com/mimateinn/dsh-i18n

## Sicurezza e privacy

Il plugin non ha dipendenze runtime, chiamate di rete, telemetria né accesso al filesystem. Salva solo l'id della lingua selezionata nel localStorage del browser.

## Licenza

MIT
