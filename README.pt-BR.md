# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

Um plugin de internacionalização sustentável para a DeepSeek Harness Web UI. A versão 0.2.0 registra **20 locales** a partir de um único registro, preservando a integração existente do DSH com o client ModuleLoader, o serviço de locale, a migração de preferências e o comportamento de fallback em tempo de execução.

## Idiomas

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย e Svenska.

- Os locales de chinês tradicional (zh-HK, zh-TW) usam os dicionários integrados de chinês simplificado como fallback, por meio do conversor de caracteres existente.
- O árabe define o idioma e a direção do documento como `ar` / `rtl`; os demais locales gerenciados usam `ltr`.
- Valores não chineses ainda não traduzidos usam o inglês como fallback.

## Recursos

- Adiciona todos os 20 locales em **Settings → General → Language**, ao lado do 中文 / English integrados.
- Traduções refinadas manualmente, idioma por idioma, para cada namespace de locale oficial (715 strings cada), a partir de uma base em inglês.
- Fallback em tempo de execução: strings novas/atualizadas/de terceiros usam o inglês como fallback (ou a conversão simplificado→tradicional para zh-HK/zh-TW), de modo que as atualizações de UI do upstream e outros plugins são cobertos sem a necessidade de retraduzir todos os idiomas.
- Preferência de idioma persistida no `localStorage` do navegador; resistente a recarregamentos.
- **Tradução automática**: quando um locale não chinês está ativo, textos longos em inglês (descrições do mercado de plugins, UI de terceiros, prosa de erros) são traduzidos automaticamente para o seu idioma por meio do seu modelo configurado — com cache e idempotência, de modo que as re-renderizações do React não entram em conflito. O idioma padrão (en/zh) permanece intacto; o chinês tradicional mantém a conversão integrada simplificado→tradicional em vez de chamar um modelo.
- Zero intrusão: plugin puramente de cliente, sem alterações em pacotes do upstream, com degradação silenciosa caso o serviço de locale esteja ausente.

## Instalação

Instale no perfil que o seu host realmente inicializa e fixe o commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

No DSH Desktop, o perfil ativo é o valor `active` em
`%APPDATA%/DSH Desktop/profile-selection/state.json` (geralmente `desktop`). O shim por perfil
`host-commands/<profile>/bin/dsh.cmd` grava o próprio nome do perfil no comando, de modo que executar o
shim `web` instala no perfil `web` mesmo quando o Desktop está mostrando `desktop` — a instalação
é bem-sucedida e o plugin nunca é carregado. Passe `--profile` explicitamente para ter certeza.

Os caminhos de instalação do Market do DSH Desktop aceitam apenas uma versão npm publicada exata, portanto uma spec do GitHub deve
passar pelo terminal integrado `dsh plugin add`, que encaminha o especificador para o pnpm sem validação.

Reinicie o host e escolha um idioma em **Settings → General → Language**. Remova com
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## Pipeline de manutenção

O registro de locales é `scripts/locales.mjs`. Os dados de tradução permanecem em `src/<locale>/`; o código de navegador gerado é `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

A extração aceita uma raiz do DSH instalado, seu diretório de pacote `@deepseek-ai` ou o caminho do aplicativo desktop descompactado.

## Publicação

O pacote npm inclui entradas de tempo de execução, o client gerado, os dados de locale e o registro de locales. Repositório de origem: https://github.com/mimateinn/dsh-i18n

## Segurança e privacidade

- O plugin não faz chamadas de rede por conta própria, não tem telemetria e lê/grava apenas duas chaves do localStorage do navegador: o id do locale selecionado e a substituição do modelo de tradução.
- A tradução automática roda pelo serviço LLM integrado do DSH (seu modelo configurado), não por uma API de terceiros. Ela só é acionada para prosa longa em inglês quando um locale não chinês está ativo; o idioma padrão nunca é enviado para tradução.
- Sem acesso ao sistema de arquivos, sem manipulação de credenciais.

## Licença

MIT
