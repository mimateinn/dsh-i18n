"""最終檢查：側邊欄第三方插件字串（chat-import）自動轉換 + {n} 替換"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3080"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(4000)
    page.evaluate("() => window.localStorage.setItem('dsh-i18n.preference', 'zh-TW')")
    page.reload(wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(5000)
    page.get_by_role("button", name="設定", exact=False).first.wait_for(state="visible", timeout=15000)
    page.wait_for_timeout(1000)

    # 關閉可能開住嘅面板（Esc）
    page.keyboard.press("Escape")
    page.wait_for_timeout(800)

    btns = [(b.inner_text() or "").strip() for b in page.locator("button").all()]
    print("=== sidebar buttons (zh-TW) ===")
    for t in btns:
        if t:
            print("  ", repr(t))
    body = page.locator("body").inner_text()
    print("=== key strings ===")
    for k in ["新會話", "工作區", "導入會話", "展開其餘", "展開其餘 {n}", "設定"]:
        print(f"  {k}:", k in body)
    try:
        page.screenshot(path=sys.path[0] + r"\final-zh-tw.png", full_page=True)
    except Exception:
        pass
    browser.close()
    print("DONE")
