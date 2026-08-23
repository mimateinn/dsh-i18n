# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

DeepSeek Harness Web UI के लिए एक टिकाऊ अंतर्राष्ट्रीयकरण (internationalization) प्लगइन। संस्करण 0.2.0 एक ही रजिस्ट्री से **20 locales** पंजीकृत करता है, साथ ही DSH के मौजूदा क्लाइंट ModuleLoader इंटीग्रेशन, locale सेवा, प्राथमिकता माइग्रेशन और रनटाइम fallback व्यवहार को बनाए रखता है।

## Locales

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย, और Svenska.

- पारंपरिक चीनी locales (zh-HK, zh-TW) मौजूदा character converter के माध्यम से अंतर्निहित सरलीकृत चीनी शब्दकोशों से fallback करते हैं।
- अरबी दस्तावेज़ की भाषा और दिशा को `ar` / `rtl` पर सेट करती है; अन्य प्रबंधित locales `ltr` का उपयोग करते हैं।
- अनुवादित न होने वाले गैर-चीनी मान अंग्रेज़ी में fallback होते हैं।

## विशेषताएँ

- सभी 20 locales को **Settings → General → Language** में जोड़ता है, अंतर्निहित 中文 / English के साथ।
- प्रत्येक आधिकारिक locale namespace के लिए प्रति-भाषा हाथ से परिष्कृत अनुवाद (प्रत्येक में 715 strings), अंग्रेज़ी baseline से।
- रनटाइम fallback: नई/अपडेटेड/थर्ड-पार्टी strings अंग्रेज़ी में fallback होती हैं (या zh-HK/zh-TW के लिए सरलीकृत→पारंपरिक रूपांतरण), इसलिए अपस्ट्रीम UI अपडेट और अन्य प्लगइन हर भाषा को दोबारा अनुवाद किए बिना कवर हो जाते हैं।
- भाषा की प्राथमिकता ब्राउज़र के `localStorage` में संग्रहीत होती है; reload के बाद भी बनी रहती है।
- **स्वचालित अनुवाद**: जब कोई गैर-चीनी locale सक्रिय हो, तो लंबे अंग्रेज़ी टेक्स्ट (प्लगइन-मार्केट विवरण, थर्ड-पार्टी UI, त्रुटि पाठ) आपके कॉन्फ़िगर किए गए मॉडल के ज़रिए स्वतः आपकी भाषा में अनुवादित हो जाते हैं — कैश किए गए और idempotent, ताकि React री-रेंडर उनसे टकराएँ नहीं। डिफ़ॉल्ट भाषा (en/zh) को वैसे ही छोड़ दिया जाता है; पारंपरिक चीनी मॉडल को बुलाने के बजाय अंतर्निहित सरलीकृत→पारंपरिक रूपांतरण का उपयोग करती रहती है।
- शून्य हस्तक्षेप: शुद्ध क्लाइंट प्लगइन, अपस्ट्रीम पैकेज में कोई बदलाव नहीं, locale सेवा उपलब्ध न होने पर मौन रूप से ख़राब (degrade) हो जाता है।

## इंस्टॉलेशन

उस प्रोफ़ाइल में इंस्टॉल करें जिसे आपका होस्ट वास्तव में बूट करता है, और commit को पिन करें:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

DSH Desktop के लिए सक्रिय प्रोफ़ाइल `%APPDATA%/DSH Desktop/profile-selection/state.json` में `active` मान है (आमतौर पर `desktop`)। प्रति-प्रोफ़ाइल शिम `host-commands/<profile>/bin/dsh.cmd` अपना स्वयं का प्रोफ़ाइल नाम कमांड में समाहित कर लेता है, इसलिए `web` शिम चलाने पर प्लगइन `web` प्रोफ़ाइल में इंस्टॉल होता है, भले ही Desktop `desktop` दिखा रहा हो — इंस्टॉल सफल हो जाता है लेकिन प्लगइन कभी लोड नहीं होता। सुनिश्चित होने के लिए स्पष्ट रूप से `--profile` पास करें।

DSH Desktop के Market इंस्टॉल पथ केवल एक सटीक प्रकाशित npm संस्करण स्वीकार करते हैं, इसलिए GitHub spec को अंतर्निहित टर्मिनल `dsh plugin add` से होकर जाना चाहिए, जो specifier को बिना सत्यापन के pnpm को अग्रेषित करता है।

होस्ट को पुनः आरंभ करें, फिर **Settings → General → Language** में भाषा चुनें। हटाने के लिए `dsh plugin --profile <active-profile> remove dsh-i18n` का उपयोग करें।

## रखरखाव पाइपलाइन

locale रजिस्ट्री `scripts/locales.mjs` है। अनुवाद डेटा `src/<locale>/` में रहता है; उत्पन्न ब्राउज़र कोड `lib/client.js` है।

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

Extraction एक इंस्टॉल किया हुआ DSH root, उसकी `@deepseek-ai` पैकेज निर्देशिका, या अनपैक्ड डेस्कटॉप एप्लिकेशन पथ स्वीकार करता है।

## प्रकाशन

npm पैकेज में रनटाइम एंट्री, उत्पन्न क्लाइंट, locale डेटा और locale रजिस्ट्री शामिल हैं। स्रोत रिपॉज़िटरी: https://github.com/mimateinn/dsh-i18n

## सुरक्षा और गोपनीयता

- प्लगइन स्वयं कोई नेटवर्क कॉल नहीं करता, इसमें कोई टेलीमेट्री नहीं है, और यह केवल दो ब्राउज़र localStorage कुंजियाँ पढ़ता/लिखता है: चयनित locale id और ट्रांसलेट-मॉडल ओवरराइड।
- स्वचालित अनुवाद DSH की अंतर्निहित LLM सेवा (आपके कॉन्फ़िगर किए गए मॉडल) से चलता है, किसी थर्ड-पार्टी API से नहीं। यह केवल तभी चालू होता है जब कोई गैर-चीनी locale सक्रिय हो और पाठ लंबी अंग्रेज़ी में हो; डिफ़ॉल्ट भाषा कभी अनुवाद के लिए नहीं भेजी जाती।
- कोई फ़ाइलसिस्टम एक्सेस नहीं, कोई क्रेडेंशियल हैंडलिंग नहीं।

## लाइसेंस

MIT
