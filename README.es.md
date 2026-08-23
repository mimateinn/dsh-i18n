# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Un plugin de internacionalización sostenible para la interfaz web de DeepSeek Harness. La versión 0.2.0 registra **20 idiomas** desde un único registro, conservando la integración existente del ModuleLoader del cliente de DSH, el servicio de locales, la migración de preferencias y el comportamiento de respaldo en tiempo de ejecución.

## Idiomas

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย y Svenska.

- Los idiomas de chino tradicional (zh-HK, zh-TW) recurren a los diccionarios integrados de chino simplificado mediante el conversor de caracteres existente.
- El árabe establece el idioma y la dirección del documento en `ar` / `rtl`; los demás idiomas gestionados usan `ltr`.
- Los valores no chinos sin traducir recurren al inglés.

## Características

- Añade los 20 idiomas a **Settings → General → Language**, junto a los integrados 中文 / English.
- Traducciones pulidas a mano por idioma para cada espacio de nombres de locale oficial (715 cadenas cada uno), partiendo de una base en inglés.
- Respaldo en tiempo de ejecución: las cadenas nuevas, actualizadas o de terceros recurren al inglés (o a la conversión de simplificado→tradicional para zh-HK/zh-TW), de modo que las actualizaciones de la interfaz y otros plugins quedan cubiertos sin necesidad de retraducir todos los idiomas.
- La preferencia de idioma se guarda en el `localStorage` del navegador; resiste las recargas.
- Cero intrusión: plugin de cliente puro, sin cambios en paquetes ascendentes, degradación silenciosa si falta el servicio de locales.

## Instalación

Instálalo en el perfil que realmente arranca tu host y fija el commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

En DSH Desktop, el perfil activo es el valor `active` de `%APPDATA%/DSH Desktop/profile-selection/state.json` (normalmente `desktop`). El shim por perfil `host-commands/<profile>/bin/dsh.cmd` incorpora su propio nombre de perfil al comando, de modo que ejecutar el shim `web` instala en el perfil `web` incluso cuando Desktop muestra `desktop`: la instalación se completa pero el plugin nunca se carga. Pasa `--profile` explícitamente para asegurarte.

Las rutas de instalación del Market de DSH Desktop solo aceptan una versión exacta publicada en npm, por lo que una especificación de GitHub debe pasar por el terminal integrado `dsh plugin add`, que reenvía el especificador a pnpm sin validar.

Reinicia el host y elige un idioma en **Settings → General → Language**. Elimínalo con `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Flujo de mantenimiento

El registro de locales es `scripts/locales.mjs`. Los datos de traducción se mantienen en `src/<locale>/`; el código de navegador generado es `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

La extracción acepta una raíz de DSH instalada, su directorio de paquete `@deepseek-ai` o la ruta de la aplicación de escritorio desempaquetada.

## Publicación

El paquete npm incluye los puntos de entrada en tiempo de ejecución, el cliente generado, los datos de locales y el registro de locales. Repositorio de código: https://github.com/mimateinn/dsh-i18n

## Seguridad y privacidad

El plugin no tiene dependencias en tiempo de ejecución, llamadas de red, telemetría ni acceso al sistema de archivos. Solo almacena el id del locale seleccionado en el localStorage del navegador.

## Licencia

MIT
