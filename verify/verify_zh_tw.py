"""DSH 繁中插件驗證 v2：語言選項 + 切換 + 持久化(localStorage) + 第三方插件自動轉換"""
import sys, json, re
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3080"
results = {}

def snap(page, path):
    try:
        page.screenshot(path=path, full_page=True)
    except Exception as e:
        print("screenshot failed:", path, e)

def body_text(page):
    return page.locator("body").inner_text()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(4000)

    # 開啟設置
    settings_btn = page.get_by_role("button", name="设置", exact=False).first
    settings_btn.click()
    page.wait_for_timeout(1200)

    # 語言行：menu button 內容為「中文」
    lang_btn = page.locator('button[aria-haspopup="menu"]', has_text="中文").first
    if lang_btn.count() == 0:
        lang_btn = page.get_by_role("button", name="中文", exact=True).first
    print("lang row found:", lang_btn.count() > 0)

    lang_btn.click()
    page.wait_for_timeout(800)
    menu = body_text(page)
    results["menu_has_zh"] = "中文" in menu
    results["menu_has_en"] = "English" in menu
    results["menu_has_zh_TW"] = "繁體中文" in menu
    print("menu options:", {k: results[k] for k in results})

    tw = page.get_by_text("繁體中文", exact=True)
    tw.first.click()
    page.wait_for_timeout(1500)

    body = body_text(page)
    results["switched_setting"] = "設定" in body
    results["switched_language"] = "語言" in body
    results["no_simplified_设置"] = "设置" not in body
    print("after switch:", {k: results[k] for k in results if k.startswith("switched") or k.startswith("no_")})

    # 第三方插件自動轉換：dsh-chat-import 側邊欄「导入会话」應變「匯入會話」
    # （chat-import namespace 無精譯，走運行時字元轉換）
    all_buttons = page.locator("button").all()
    btn_texts = [ (b.inner_text() or "").strip() for b in all_buttons ]
    zh_present = any("导入会话" in t or "导入" in t for t in btn_texts)
    tw_present = any("匯入會話" in t or "匯入" in t for t in btn_texts)
    results["chatimport_zh"] = zh_present
    results["chatimport_tw"] = tw_present
    print("chat-import buttons:", [t for t in btn_texts if "导入" in t or "匯入" in t])

    # localStorage 持久化
    pref = page.evaluate("() => window.localStorage.getItem('dsh-i18n.preference')")
    results["localStorage_pref"] = pref
    print("localStorage pref:", pref)

    # 重新載入
    page.reload(wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(4000)
    body2 = body_text(page)
    results["persist_setting"] = "設定" in body2
    results["persist_language"] = "語言" in body2
    results["persist_no_simplified"] = "设置" not in body2
    print("after reload:", {k: results[k] for k in results if k.startswith("persist")})

    # 切回中文，驗證偏好清除
    settings_btn2 = page.get_by_role("button", name="設定", exact=False).first
    if settings_btn2.count() == 0:
        settings_btn2 = page.get_by_role("button", name="设置", exact=False).first
    settings_btn2.click()
    page.wait_for_timeout(1000)
    lang_btn2 = page.locator('button[aria-haspopup="menu"]', has_text="繁體中文").first
    if lang_btn2.count() == 0:
        lang_btn2 = page.locator('button[aria-haspopup="menu"]', has_text="中文").first
    lang_btn2.click()
    page.wait_for_timeout(600)
    zh_opt = page.get_by_text("中文", exact=True)
    if zh_opt.count() > 0:
        zh_opt.first.click()
        page.wait_for_timeout(1000)
        pref2 = page.evaluate("() => window.localStorage.getItem('dsh-i18n.preference')")
        results["pref_cleared_after_zh"] = (pref2 is None)
        print("pref after switching back to 中文:", pref2)

    print("\n=== SUMMARY ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    browser.close()
    print("DONE")
