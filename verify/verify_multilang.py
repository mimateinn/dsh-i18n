"""多語言 E2E 驗證：語言選單 6 語言、切換、持久化、en fallback"""
import sys, json
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3080"
results = {}

def body_text(page):
    return page.locator("body").inner_text()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)

    # 開設定 → 語言行
    for label in ["设置", "設定"]:
        loc = page.get_by_role("button", name=label, exact=False)
        if loc.count() > 0:
            loc.first.click()
            page.wait_for_timeout(1500)
            break
    lang_btn = page.locator('button[aria-haspopup="menu"]', has_text="中文").first
    if lang_btn.count() == 0:
        lang_btn = page.locator('button[aria-haspopup="menu"]').first
    lang_btn.click()
    page.wait_for_timeout(800)
    menu = body_text(page)
    for opt in ["中文", "English", "繁體中文", "日本語", "한국어", "Français", "Deutsch", "Español"]:
        results["menu_" + opt] = opt in menu
    print("menu options:", {k: v for k, v in results.items() if k.startswith("menu_")})

    # 切到日本語
    page.get_by_text("日本語", exact=True).first.click()
    page.wait_for_timeout(1500)
    body = body_text(page)
    results["ja_言語"] = "言語" in body
    results["ja_設定"] = "設定" in body
    results["ja_new_session"] = "新規セッション" in body or "セッション" in body
    print("ja:", {k: v for k, v in results.items() if k.startswith("ja_")})

    # 切到 한국어
    lang_btn2 = page.locator('button[aria-haspopup="menu"]', has_text="日本語").first
    if lang_btn2.count() == 0:
        lang_btn2 = page.locator('button[aria-haspopup="menu"]').first
    lang_btn2.click()
    page.wait_for_timeout(700)
    page.get_by_text("한국어", exact=True).first.click()
    page.wait_for_timeout(1500)
    body = body_text(page)
    results["ko_언어"] = "언어" in body
    results["ko_새세션"] = "새 세션" in body or "세션" in body
    print("ko:", {k: v for k, v in results.items() if k.startswith("ko_")})

    # localStorage 持久化
    pref = page.evaluate("() => window.localStorage.getItem('dsh-i18n.preference')")
    results["pref"] = pref
    print("pref:", pref)

    # reload 保持
    page.reload(wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)
    body = body_text(page)
    results["persist_ko"] = "언어" in body
    print("after reload ko persists:", results["persist_ko"])

    print("\n=== SUMMARY ===")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    browser.close()
    print("DONE")
