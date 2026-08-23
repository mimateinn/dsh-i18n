# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

DeepSeek Harness Web UI 向けの持続可能な国際化プラグインです。バージョン 0.2.0 は、1 つのレジストリから **20 のロケール** を登録しつつ、DSH の既存のクライアント ModuleLoader 統合、ロケールサービス、設定の移行、およびランタイムのフォールバック動作を維持します。

## ロケール

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, and Svenska.

- 繁体字中国語ロケール（zh-HK、zh-TW）は、既存の文字変換器を介して、組み込みの簡体字中国語辞書からフォールバックします。
- アラビア語はドキュメントの言語と方向を `ar` / `rtl` に設定します。その他の管理対象ロケールは `ltr` を使用します。
- 未翻訳の非中国語の値は英語にフォールバックします。

## 機能

- 組み込みの 中文 / English に加えて、20 のロケールすべてを **Settings → General → Language** に追加します。
- 英語のベースラインから、すべての公式ロケール名前空間（各 715 文字列）に対して、言語ごとに手作業で磨き上げた翻訳を提供します。
- ランタイムフォールバック: 新規・更新・サードパーティの文字列は英語にフォールバックするため（zh-HK/zh-TW は簡体字→繁体字変換）、上流の UI 更新や他のプラグインも、全言語を再翻訳することなくカバーされます。
- 言語設定はブラウザの `localStorage` に保存され、リロード後も維持されます。
- **没入型翻訳**: 非中国語ロケールが有効な場合、長い英語テキスト（プラグインマーケットの説明、サードパーティ UI、エラー文）が、設定済みモデル経由で自動的にあなたの言語へ翻訳されます。キャッシュされ冪等であるため、React の再レンダリングと競合しません。デフォルト言語（en/zh）はそのまま残されます。繁体字中国語は、モデルを呼び出す代わりに組み込みの簡体字→繁体字変換を使い続けます。
- ゼロ侵入: 純粋なクライアントプラグインであり、上流パッケージの変更はなく、ロケールサービスが存在しない場合は静かに機能を縮退させます。

## インストール

ホストが実際に起動するプロファイルにインストールし、コミットを固定してください。

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

DSH Desktop の場合、アクティブなプロファイルは `%APPDATA%/DSH Desktop/profile-selection/state.json` 内の `active` の値（通常は `desktop`）です。プロファイルごとのシム `host-commands/<profile>/bin/dsh.cmd` は自身のプロファイル名をコマンドに埋め込むため、Desktop が `desktop` を表示している場合でも `web` シムを実行すると `web` プロファイルにインストールされます。インストールは成功しますが、プラグインは決して読み込まれません。確実にするには `--profile` を明示的に渡してください。

DSH Desktop の Market インストール経路は、公開済みの正確な npm バージョンのみを受け付けるため、GitHub の指定子は組み込みターミナルの `dsh plugin add` を経由する必要があります。これは指定子を未検証のまま pnpm に転送します。

ホストを再起動し、**Settings → General → Language** で言語を選択してください。削除するには `dsh plugin --profile <active-profile> remove dsh-i18n` を実行します。

## メンテナンスパイプライン

ロケールレジストリは `scripts/locales.mjs` です。翻訳データは `src/<locale>/` に置かれ、生成されるブラウザコードは `lib/client.js` です。

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

抽出は、インストール済みの DSH ルート、その `@deepseek-ai` パッケージディレクトリ、または展開済みのデスクトップアプリケーションのパスを受け付けます。

## 公開

npm パッケージには、ランタイムエントリ、生成されたクライアント、ロケールデータ、ロケールレジストリが含まれます。ソースリポジトリ: https://github.com/mimateinn/dsh-i18n

## セキュリティとプライバシー

- このプラグイン自体はネットワーク呼び出しを行わず、テレメトリもなく、読み書きするのはブラウザの localStorage キー 2 つ（選択されたロケール ID と翻訳モデルの上書き）のみです。
- 没入型翻訳は、サードパーティ API ではなく、DSH 内蔵の LLM サービス（設定済みモデル）を通じて実行されます。非中国語ロケールが有効な場合にのみ、長い英語の散文に対して発火し、デフォルト言語が翻訳に送信されることはありません。
- ファイルシステムへのアクセスなし、資格情報の処理なし。

## ライセンス

MIT
