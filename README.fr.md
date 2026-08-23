# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Un plugin d'internationalisation durable pour l'interface Web de DeepSeek Harness. La version 0.2.0 enregistre **20 locales** à partir d'un registre unique tout en préservant l'intégration existante du ModuleLoader client de DSH, le service de locales, la migration des préférences et le comportement de repli à l'exécution.

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, et Svenska.

- Les locales de chinois traditionnel (zh-HK, zh-TW) utilisent le repli depuis les dictionnaires de chinois simplifié intégrés via le convertisseur de caractères existant.
- L'arabe définit la langue et la direction du document sur `ar` / `rtl` ; les autres locales gérées utilisent `ltr`.
- Les valeurs non chinoises non traduites utilisent l'anglais comme repli.

## Fonctionnalités

- Ajoute les 20 locales à **Settings → General → Language**, aux côtés des 中文 / English intégrés.
- Des traductions soignées à la main pour chaque langue, couvrant chaque espace de noms de locale officiel (715 chaînes chacune), à partir d'une base en anglais.
- Repli à l'exécution : les chaînes nouvelles, mises à jour ou tierces utilisent l'anglais comme repli (ou la conversion simplifié → traditionnel pour zh-HK/zh-TW), de sorte que les mises à jour de l'interface amont et les autres plugins sont couverts sans retraduire chaque langue.
- Préférence de langue conservée dans le `localStorage` du navigateur ; résistante au rechargement.
- **Traduction immersive** : lorsqu'une locale non chinoise est active, les longs textes en anglais (descriptions du marché des plugins, UI tierce, prose d'erreur) sont traduits automatiquement dans votre langue via votre modèle configuré — mis en cache et idempotent, de sorte que les re-rendus de React n'entrent pas en conflit. La langue par défaut (en/zh) n'est pas modifiée ; le chinois traditionnel conserve la conversion simplifié → traditionnel intégrée au lieu d'appeler un modèle.
- Zéro intrusion : plugin purement client, aucune modification des paquets amont, dégradation silencieuse si le service de locales est absent.

## Installation

Installez dans le profil que votre hôte démarre réellement, et épinglez le commit :

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

Pour DSH Desktop, le profil actif est la valeur `active` dans `%APPDATA%/DSH Desktop/profile-selection/state.json` (généralement `desktop`). Le shim par profil `host-commands/<profile>/bin/dsh.cmd` intègre son propre nom de profil dans la commande ; ainsi, l'exécution du shim `web` installe dans le profil `web` même lorsque Desktop affiche `desktop` — l'installation réussit mais le plugin n'est jamais chargé. Passez explicitement `--profile` pour être sûr.

Les chemins d'installation du Market de DSH Desktop n'acceptent qu'une version npm publiée exacte ; une spécification GitHub doit donc passer par le terminal intégré `dsh plugin add`, qui transmet le spécificateur à pnpm sans validation.

Redémarrez l'hôte, puis choisissez une langue dans **Settings → General → Language**. Désinstallez avec `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Pipeline de maintenance

Le registre de locales est `scripts/locales.mjs`. Les données de traduction restent dans `src/<locale>/` ; le code navigateur généré est `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

L'extraction accepte une racine DSH installée, son répertoire de paquet `@deepseek-ai`, ou le chemin de l'application de bureau décompressée.

## Publication

Le paquet npm inclut les entrées d'exécution, le client généré, les données de locales et le registre de locales. Dépôt source : https://github.com/mimateinn/dsh-i18n

## Sécurité et confidentialité

- Le plugin n'effectue lui-même aucun appel réseau, n'a aucune télémétrie, et ne lit/écrit que deux clés du localStorage du navigateur : l'identifiant de locale sélectionné et la substitution du modèle de traduction.
- La traduction immersive passe par le service LLM intégré de DSH (votre modèle configuré), et non par une API tierce. Elle ne se déclenche que pour de longs textes en anglais lorsqu'une locale non chinoise est active ; la langue par défaut n'est jamais envoyée à la traduction.
- Aucun accès au système de fichiers, aucune gestion d'identifiants.

## Licence

MIT
