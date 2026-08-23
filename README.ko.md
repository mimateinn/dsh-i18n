# dsh-i18n

**[繁體中文（香港）](README.zh-HK.md)** · **[繁體中文（台灣）](README.zh-TW.md)** · [English](README.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Português (Brasil)](README.pt-BR.md) · [Italiano](README.it.md) · [Русский](README.ru.md) · [Українська](README.uk.md) · [Polski](README.pl.md) · [Nederlands](README.nl.md) · [Türkçe](README.tr.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [Svenska](README.sv.md)

DeepSeek Harness Web UI를 위한 지속 가능한 국제화(i18n) 플러그인입니다. 버전 0.2.0은 단일 레지스트리에서 **20개 로케일**을 등록하면서도 DSH의 기존 클라이언트 ModuleLoader 통합, locale service, 설정 마이그레이션, 런타임 폴백 동작을 그대로 유지합니다.

## 로케일

繁體中文（香港、台灣）, 日本語, 한국어, Français, Deutsch, Español, Português (Brasil), Italiano, Русский, Українська, Polski, Nederlands, Türkçe, العربية, हिन्दी, Bahasa Indonesia, Tiếng Việt, ไทย 및 Svenska.

- 번체 중국어 로케일(zh-HK, zh-TW)은 기존 문자 변환기를 통해 내장된 간체 중국어 사전에서 폴백됩니다.
- 아랍어는 문서 언어와 방향을 `ar` / `rtl`로 설정하며, 그 외 관리되는 로케일은 `ltr`을 사용합니다.
- 번역되지 않은 비중국어 값은 영어로 폴백됩니다.

## 기능

- 내장된 中文 / English와 함께 20개 로케일을 모두 **Settings → General → Language**에 추가합니다.
- 영어 기준선을 바탕으로 모든 공식 로케일 네임스페이스에 대해 언어별로 세심하게 다듬은 번역(각 715개 문자열)을 제공합니다.
- 런타임 폴백: 신규/업데이트/타사 문자열은 영어로 폴백되므로(zh-HK/zh-TW는 간체→번체 변환), 모든 언어를 다시 번역하지 않아도 업스트림 UI 업데이트와 다른 플러그인을 지원합니다.
- 언어 설정은 브라우저 `localStorage`에 저장되어 새로고침에도 유지됩니다.
- **몰입형 번역**: 비중국어 locale이 활성화되면 긴 영어 텍스트(플러그인 마켓 설명, 타사 UI, 오류 문구)가 설정된 모델을 통해 자동으로 사용자의 언어로 번역됩니다. 캐시되고 멱등(idempotent)하여 React 재렌더링과 충돌하지 않습니다. 기본 언어(en/zh)는 그대로 두며, 번체 중국어는 모델을 호출하는 대신 내장된 간체→번체 변환을 계속 사용합니다.
- 무침투: 순수 클라이언트 플러그인으로 업스트림 패키지를 변경하지 않으며, locale service가 없으면 조용히 기능이 저하됩니다.

## 설치

호스트가 실제로 부팅하는 프로필에 설치하고 커밋을 고정(pin)하세요:

```bash
dsh plugin --profile <active-profile> add github:mimateinn/dsh-i18n#<commit>
```

DSH Desktop에서 활성 프로필은 `%APPDATA%/DSH Desktop/profile-selection/state.json`의 `active` 값입니다(일반적으로 `desktop`). 프로필별 shim인 `host-commands/<profile>/bin/dsh.cmd`는 자체 프로필 이름을 명령에 포함시키므로, Desktop이 `desktop`을 표시하는 동안에도 `web` shim을 실행하면 `web` 프로필에 설치됩니다. 이때 설치 자체는 성공하지만 플러그인은 절대 로드되지 않습니다. 확실하게 하려면 `--profile`을 명시적으로 전달하세요.

DSH Desktop의 Market 설치 경로는 정확히 게시된 npm 버전만 허용하므로, GitHub 스펙은 내장 터미널의 `dsh plugin add`를 통해야 합니다. 이 명령은 스펙을 검증 없이 pnpm에 그대로 전달합니다.

호스트를 재시작한 다음 **Settings → General → Language**에서 언어를 선택하세요. 제거는 `dsh plugin --profile <active-profile> remove dsh-i18n`으로 합니다.

## 유지보수 파이프라인

로케일 레지스트리는 `scripts/locales.mjs`입니다. 번역 데이터는 `src/<locale>/`에 유지되며, 생성된 브라우저 코드는 `lib/client.js`입니다.

```bash
npm run i18n:check     # file, namespace/key, stale, placeholder, empty, English-residue, Simplified-residue parity
npm run i18n:build     # assemble registry locales into lib/client.js
npm test               # check + build + converter verification + runtime harness

node scripts/extract.mjs <installed-dsh-path>
```

추출(extraction)은 설치된 DSH 루트, 해당 `@deepseek-ai` 패키지 디렉터리, 또는 압축 해제된 데스크톱 애플리케이션 경로를 입력으로 받습니다.

## 배포

npm 패키지에는 런타임 엔트리, 생성된 클라이언트, 로케일 데이터, 로케일 레지스트리가 포함됩니다. 소스 저장소: https://github.com/mimateinn/dsh-i18n

## 보안 및 개인정보 보호

- 이 플러그인은 자체적으로 네트워크 호출을 하지 않고 원격 측정(telemetry)도 없으며, 브라우저 localStorage 키 두 개(선택한 locale id와 번역 모델 재정의)만 읽고 씁니다.
- 몰입형 번역은 타사 API가 아닌 DSH 내장 LLM 서비스(설정된 모델)를 통해 실행됩니다. 비중국어 locale이 활성화된 경우에만 긴 영어 산문에 대해 작동하며, 기본 언어는 번역을 위해 전송되지 않습니다.
- 파일 시스템 접근 없음, 자격 증명 처리 없음.

## 라이선스

MIT
