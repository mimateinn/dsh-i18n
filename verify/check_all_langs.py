"""快速驗證 6 語言渲染：set pref → reload → 檢查側邊欄特徵字串"""
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from playwright.sync_api import sync_playwright

LANGS = [
    ("zh-TW", "新會話"),
    ("ja", "セッション"),
    ("ko", "새 세션"),
    ("fr", "Nouvelle session"),
    ("de", "Neue Session"),
    ("es", "Nueva sesión"),
]

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()
    page.goto("http://127.0.0.1:3080", wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(4000)

    all_ok = True
    for lid, sig in LANGS:
        page.evaluate("(k) => window.localStorage.setItem('dsh-i18n.preference', k)", lid)
        page.reload(wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(6000)
        body = page.locator("body").inner_text()
        ok = sig in body
        all_ok = all_ok and ok
        print(f"{lid}: 特徵「{sig}」→ {'✓' if ok else '✗'}")
        if not ok:
            snippet = body[:150].replace(chr(10), " | ")
            print(f"   body: {snippet}")

    print("\n=== 結果:", "全部通過" if all_ok else "有失敗", "===")
    b.close()
    print("DONE")

