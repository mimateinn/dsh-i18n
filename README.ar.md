# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

إضافة تدويل (i18n) مستدامة لواجهة DeepSeek Harness Web UI. يسجّل الإصدار 0.2.0 **20 locale** من سجلّ واحد، مع الحفاظ على تكامل ModuleLoader الخاص بالعميل في DSH، وخدمة الـ locale، وترحيل التفضيلات، وسلوك الـ fallback وقت التشغيل.

## اللغات (Locales)

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, و Svenska.

- لغاتا الصينية التقليدية (zh-HK, zh-TW) تتراجعان (fall back) إلى قواميس الصينية المبسّطة المدمجة عبر محوّل الأحرف الموجود.
- اللغة العربية تضبط لغة المستند واتجاهه إلى `ar` / `rtl`؛ أمّا بقية الـ locale المُدارة فتستخدم `ltr`.
- القيم غير الصينية غير المترجمة تتراجع إلى English.

## الميزات

- يضيف الـ 20 locale كلها إلى **Settings → General → Language**، إلى جانب اللغتين المدمجتين 中文 / English.
- ترجمات مُنقّحة يدويًا لكل لغة ولكل namespace رسمي من الـ locale (715 سلسلة نصية لكل واحدة)، انطلاقًا من أساس إنجليزي.
- Fallback وقت التشغيل: السلاسل الجديدة/المُحدّثة/التابعة لجهات خارجية تتراجع إلى English (أو التحويل من الصينية المبسّطة إلى التقليدية بالنسبة إلى zh-HK/zh-TW)، بحيث تُغطّى تحديثات واجهة المنبع والإضافات الأخرى دون الحاجة إلى إعادة ترجمة كل لغة.
- تفضيل اللغة يُحفظ في `localStorage` الخاص بالمتصفح؛ ويبقى ساريًا بعد إعادة التحميل.
- **الترجمة التلقائية**: عندما تكون لغة غير صينية نشطة، تُترجم النصوص الإنجليزية الطويلة (أوصاف سوق الإضافات، وواجهات الأطراف الثالثة، ونصوص الأخطاء) تلقائيًا إلى لغتك عبر نموذجك المُعدّ — مع تخزين مؤقت وخاصية idempotent بحيث لا تتعارض معها عمليات إعادة العرض في React. تبقى اللغة الافتراضية (en/zh) كما هي دون تغيير؛ وتحتفظ الصينية التقليدية بالتحويل المدمج من المبسّطة إلى التقليدية بدلًا من استدعاء نموذج.
- صفر تدخّل: إضافة عميل خالصة، دون أي تعديل على حزم المنبع، مع تدهور صامت إذا كانت خدمة الـ locale مفقودة.

## التثبيت

ثبّتها في الـ profile الذي يقلعه مضيفك فعليًا، وثبّت الـ commit:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

بالنسبة إلى DSH Desktop، فإن الـ profile النشط هو قيمة `active` في
`%APPDATA%/DSH Desktop/profile-selection/state.json` (عادةً `desktop`). يقوم الـ shim الخاص بكل profile
`host-commands/<profile>/bin/dsh.cmd` بدمج اسم الـ profile الخاص به في الأمر، لذا فإن تشغيل shim الخاص بـ `web`
يثبّت الإضافة في الـ profile الخاص بـ `web` حتى عندما يعرض Desktop قيمة `desktop` — فينجح التثبيت
ولا تُحمَّل الإضافة أبدًا. مرّر `--profile` صراحةً لتكون متأكدًا.

مسارات التثبيت عبر Market في DSH Desktop لا تقبل إلا نسخة npm منشورة مطابقة تمامًا، لذا يجب أن تمرّ مواصفات GitHub
عبر الطرفية المدمجة `dsh plugin add`، التي تمرّر المواصفات إلى pnpm دون أي تحقق.

أعد تشغيل المضيف، ثم اختر لغة من **Settings → General → Language**. وللإزالة استخدم
`dsh plugin --profile <active-profile> remove dsh-i18n`.

## مسار الصيانة

سجلّ الـ locale هو `scripts/locales.mjs`. تبقى بيانات الترجمة في `src/<locale>/`؛ وكود المتصفح المُولَّد هو `lib/client.js`.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

يقبل الاستخراج (Extraction) جذر DSH المثبّت، أو دليل حزمة `@deepseek-ai` الخاص به، أو مسار تطبيق سطح المكتب غير المضغوط.

## النشر

تتضمن حزمة npm مُدخلات التشغيل، والعميل المُولَّد، وبيانات الـ locale، وسجلّ الـ locale. المستودع المصدر: https://github.com/mimateinn/dsh-i18n

## الأمان والخصوصية

- لا تُجري الإضافة أي اتصالات شبكة بنفسها، ولا تجمع بيانات (telemetry)، وتقرأ/تكتب مفتاحَي localStorage فقط في المتصفح: معرّف الـ locale المختار وتجاوز نموذج الترجمة.
- تعمل الترجمة التلقائية عبر خدمة LLM المدمجة في DSH (نموذجك المُعدّ)، وليس عبر API طرف ثالث. وهي لا تعمل إلا مع النصوص الإنجليزية الطويلة عندما تكون لغة غير صينية نشطة؛ ولا تُرسَل اللغة الافتراضية للترجمة أبدًا.
- لا وصول إلى نظام الملفات، ولا معالجة لبيانات الاعتماد.

## الترخيص

MIT
