// index.mjs — dsh-i18n 插件（Host 側）
//
// 本插件為純 client 插件：語言選擇經瀏覽器 localStorage 持久化，Host 側無需
// 任何服務。此入口僅因 cordis.patch.yml 的 bundle 機制需要一個可解析的包主入口
// （插件要經「insert 一個 host entry」先會被 profile 載入，client 入口依附其上）。
// 保持 apply 為 no-op：唔註冊任何 settings namespace、唔 import 任何 host 套件，
// 將 host 側表面降至最低（少一個出錯位，亦無需 dsh-settings / schemastery 依賴）。

const name = "dsh-i18n";
const inject = [];

function apply() {
  // no-op：功能全部在 client 側（lib/client.js）。
}

export { apply, inject, name };
