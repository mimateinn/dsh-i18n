# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Trwała wtyczka internacjonalizacyjna dla interfejsu DeepSeek Harness Web UI. Wersja 0.2.0 rejestruje **20 języków (locales)** z jednego rejestru, zachowując istniejącą integrację klienta DSH z ModuleLoader, usługę języków (locale service), migrację preferencji oraz zachowanie awaryjnego przełączania (runtime fallback).

## Języki

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย i Svenska.

- Języki chińskiego tradycyjnego (zh-HK, zh-TW) przełączają się awaryjnie na wbudowane słowniki chińskiego uproszczonego za pośrednictwem istniejącego konwertera znaków.
- Arabski ustawia język dokumentu i kierunek na `ar` / `rtl`; pozostałe zarządzane języki używają `ltr`.
- Nieprzetłumaczone wartości w językach innych niż chiński przełączają się awaryjnie na angielski.

## Funkcje

- Dodaje wszystkie 20 języków do **Settings → General → Language**, obok wbudowanych 中文 / English.
- Starannie dopracowane tłumaczenia dla każdego języka, dla każdej oficjalnej przestrzeni nazw (namespace) (715 ciągów każda), oparte na bazie angielskiej.
- Awaryjne przełączanie w czasie działania (runtime fallback): nowe/zaktualizowane/pochodzące od stron trzecich ciągi przełączają się awaryjnie na angielski (lub konwersję uproszczony→tradycyjny dla zh-HK/zh-TW), dzięki czemu aktualizacje UI i inne wtyczki są obsługiwane bez ponownego tłumaczenia każdego języka.
- Preferencja językowa zapisywana w przeglądarkowym `localStorage`; odporna na przeładowanie.
- **Tłumaczenie immersyjne**: gdy aktywny jest język inny niż chiński, długie teksty w języku angielskim (opisy na rynku wtyczek, UI stron trzecich, treść komunikatów o błędach) są automatycznie tłumaczone na Twój język przez skonfigurowany model — z pamięcią podręczną i idempotentnością, dzięki czemu ponowne renderowanie Reacta nie wchodzi w konflikt. Język domyślny (en/zh) pozostaje nietknięty; chiński tradycyjny zachowuje wbudowaną konwersję uproszczony→tradycyjny zamiast wywoływania modelu.
- Zero ingerencji: czysto kliencka wtyczka, bez zmian w pakietach źródłowych, cicha degradacja, jeśli usługa języków (locale service) jest niedostępna.

## Instalacja

Zainstaluj w profilu, z którym faktycznie uruchamia się Twój host, i przypnij konkretny commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

W DSH Desktop aktywnym profilem jest wartość `active` w `%APPDATA%/DSH Desktop/profile-selection/state.json` (zazwyczaj `desktop`). Shim dla danego profilu `host-commands/<profile>/bin/dsh.cmd` wpisuje nazwę swojego profilu na stałe do polecenia, więc uruchomienie shim `web` instaluje wtyczkę w profilu `web` nawet wtedy, gdy Desktop pokazuje `desktop` — instalacja kończy się sukcesem, ale wtyczka nigdy nie jest ładowana. Aby mieć pewność, przekaż jawnie `--profile`.

Ścieżki instalacji z Marketu w DSH Desktop akceptują wyłącznie dokładną opublikowaną wersję npm, więc specyfikacja GitHub musi przejść przez wbudowany terminal `dsh plugin add`, który przekazuje specyfikator do pnpm bez walidacji.

Uruchom ponownie hosta, a następnie wybierz język w **Settings → General → Language**. Usuń za pomocą `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Potok utrzymania

Rejestr języków (locale registry) to `scripts/locales.mjs`. Dane tłumaczeń znajdują się w `src/<locale>/`; wygenerowany kod przeglądarkowy to `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Ekstrakcja akceptuje zainstalowany katalog główny DSH, jego katalog pakietu `@deepseek-ai` lub ścieżkę rozpakowanej aplikacji desktopowej.

## Publikowanie

Pakiet npm zawiera wpisy środowiska uruchomieniowego (runtime), wygenerowanego klienta, dane języków oraz rejestr języków. Repozytorium źródłowe: https://github.com/mimateinn/dsh-i18n

## Bezpieczeństwo i prywatność

- Wtyczka sama nie wykonuje wywołań sieciowych, nie ma telemetrii i odczytuje/zapisuje tylko dwa klucze przeglądarkowego localStorage: identyfikator wybranego języka i nadpisanie modelu tłumaczenia.
- Tłumaczenie immersyjne działa przez wbudowaną usługę LLM DSH (Twój skonfigurowany model), a nie przez API strony trzeciej. Uruchamia się tylko dla długiej prozy angielskiej, gdy aktywny jest język inny niż chiński; język domyślny nigdy nie jest wysyłany do tłumaczenia.
- Brak dostępu do systemu plików, brak obsługi poświadczeń.

## Licencja

MIT
