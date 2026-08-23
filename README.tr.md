# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

DeepSeek Harness Web UI için sürdürülebilir bir uluslararasılaştırma eklentisi. Sürüm 0.2.0, DSH'nin mevcut istemci ModuleLoader entegrasyonunu, yerel ayar hizmetini, tercih geçişini ve çalışma zamanı yedek davranışını korurken tek bir kayıt defterinden **20 yerel ayar** kaydeder.

## Yerel Ayarlar

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย ve Svenska.

- Geleneksel Çince yerel ayarlar (zh-HK, zh-TW), mevcut karakter dönüştürücü aracılığıyla yerleşik Basitleştirilmiş Çince sözlüklerinden yedeklenir.
- Arapça, belge dilini ve yönünü `ar` / `rtl` olarak ayarlar; diğer yönetilen yerel ayarlar `ltr` kullanır.
- Çevrilmemiş, Çince olmayan değerler İngilizceye yedeklenir.

## Özellikler

- 20 yerel ayarın tümünü, yerleşik 中文 / English'in yanında **Settings → General → Language** bölümüne ekler.
- İngilizce tabanından, her resmî yerel ayar ad alanı için dil başına elle cilalanmış çeviriler (her biri 715 dize).
- Çalışma zamanı yedeği: yeni/güncellenen/üçüncü taraf dizeler İngilizceye yedeklenir (zh-HK/zh-TW için Basitleştirilmiş→Geleneksel dönüştürme), böylece üst akıştaki kullanıcı arayüzü güncellemeleri ve diğer eklentiler, her dili yeniden çevirmeden kapsanır.
- Dil tercihi tarayıcı `localStorage`'ında saklanır; yenilemeye dayanıklıdır.
- **Otomatik çeviri**: Çince olmayan bir yerel ayar etkinken, uzun İngilizce metinler (eklenti pazarı açıklamaları, üçüncü taraf arayüzler, hata metinleri) yapılandırdığınız model aracılığıyla otomatik olarak dilinize çevrilir — önbelleğe alınır ve idempotenttir, böylece React yeniden render'ları bununla çakışmaz. Varsayılan dil (en/zh) olduğu gibi bırakılır; Geleneksel Çince, bir model çağırmak yerine yerleşik Basitleştirilmiş→Geleneksel dönüştürmeyi kullanmaya devam eder.
- Sıfır müdahale: saf istemci eklentisi, üst akış paketlerinde değişiklik yok, yerel ayar hizmeti eksikse sessizce işlevini yitirir.

## Kurulum

Ana makinenizin gerçekte önyüklediği profile kurun ve commit'i sabitleyin:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

DSH Desktop için etkin profil, `%APPDATA%/DSH Desktop/profile-selection/state.json` içindeki `active` değeridir (genellikle `desktop`). Profil başına shim `host-commands/<profile>/bin/dsh.cmd`, komuta kendi profil adını işler; bu yüzden `web` shim'i, Desktop `desktop` gösteriyor olsa bile `web` profiline kurulur — kurulum başarılı olur ancak eklenti asla yüklenmez. Emin olmak için `--profile` öğesini açıkça belirtin.

DSH Desktop'ın Market kurulum yolları yalnızca tam olarak yayımlanmış bir npm sürümünü kabul eder; bu yüzden bir GitHub belirteci, belirteci doğrulanmadan pnpm'e ileten yerleşik terminal `dsh plugin add` üzerinden gitmelidir.

Ana makineyi yeniden başlatın, ardından **Settings → General → Language** bölümünden bir dil seçin. Şununla kaldırın: `dsh plugin --profile <active-profile> remove dsh-i18n`.

## Bakım hattı

Yerel ayar kayıt defteri `scripts/locales.mjs` dosyasındadır. Çeviri verileri `src/<locale>/` içinde kalır; oluşturulan tarayıcı kodu `lib/client.js` dosyasıdır.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Çıkarma işlemi, kurulu bir DSH kökünü, onun `@deepseek-ai` paket dizinini veya paketinden çıkarılmış masaüstü uygulama yolunu kabul eder.

## Yayımlama

npm paketi; çalışma zamanı girdilerini, oluşturulan istemciyi, yerel ayar verilerini ve yerel ayar kayıt defterini içerir. Kaynak depo: https://github.com/mimateinn/dsh-i18n

## Güvenlik ve gizlilik

- Eklenti kendisi hiçbir ağ çağrısı yapmaz, telemetrisi yoktur ve yalnızca iki tarayıcı localStorage anahtarını okur/yazar: seçilen yerel ayar kimliği ve çeviri modeli geçersiz kılması.
- Otomatik çeviri, üçüncü taraf bir API üzerinden değil, DSH'nin yerleşik LLM hizmeti (yapılandırdığınız model) üzerinden çalışır. Yalnızca Çince olmayan bir yerel ayar etkinken uzun İngilizce metinler için tetiklenir; varsayılan dil asla çeviriye gönderilmez.
- Dosya sistemi erişimi yok, kimlik bilgisi işleme yok.

## Lisans

MIT
