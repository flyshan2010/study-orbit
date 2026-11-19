# 自學星圖前台建置：src/ → index.html（單一檔案，題本檔另外從班網讀）
# 用法：python3 build.py        （會先把班網的 rules.mjs 正本複製到 src/rules.mjs）
# 規則：rules.mjs 只改班網的正本（class-website/scripts/classos/study-orbit/rules.mjs），這裡的複本勿手改（P2 SPEC §8）
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(here, 'src')
RULES = os.path.normpath(os.path.join(here, '..', 'class-website', 'scripts', 'classos', 'study-orbit', 'rules.mjs'))
HEAD = '// ⚠️ 自動複製，勿手改。正本：class-website/scripts/classos/study-orbit/rules.mjs（改正本後跑 study-orbit/build.py）\n'

def read(n): return open(os.path.join(SRC, n), encoding='utf-8').read()

# 1. 複製 rules.mjs 正本
if os.path.exists(RULES):
    body = open(RULES, encoding='utf-8').read()
    open(os.path.join(SRC, 'rules.mjs'), 'w', encoding='utf-8').write(HEAD + body)
else:
    print('⚠️ 找不到班網的 rules.mjs 正本，沿用 src/rules.mjs 現有複本', file=sys.stderr)

# 2. ES 模組 → 包成 IIFE，只露出 export 的名字（內部名稱不外洩、不和地圖程式撞名）
def module(name):
    s = read(name)
    names = re.findall(r'^export\s+(?:async\s+)?(?:function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)', s, re.M)
    assert names, name
    s = re.sub(r'^export\s+', '', s, flags=re.M)
    assert 'import ' not in s, f'{name} 不能有 import'
    return names, f'const {{{",".join(names)}}}=(()=>{{\n{s}\nreturn{{{",".join(names)}}}}})();'

parts, exported = [], []
for n in ['rules.mjs', 'play.mjs', 'sync.mjs', 'chart.mjs']:
    names, code = module(n)
    exported += names
    parts.append(f'/* ===== {n} ===== */\n' + code)
plain = ['data.js', 'map.js', 'game.js', 'app.js', 'api.js', 'music.js', 'boot.js']
for n in plain:
    s = read(n)
    for x in exported:   # 撞名檢查：一般腳本不可再宣告同名的頂層函式或變數
        assert not re.search(r'^(?:function|const|let|var)\s+%s\b' % re.escape(x), s, re.M), f'{n} 和模組撞名：{x}'
    parts.append(f'/* ===== {n} ===== */\n' + s)

shell = read('shell.html')
css = read('style.css')
assert shell.count('/*CSS*/') == 1 and shell.count('/*JS*/') == 1
html = shell.replace('/*CSS*/', css).replace('/*JS*/', '\n'.join(parts))
assert '</script' not in '\n'.join(parts).replace('<\\/script', ''), '程式裡不能出現 </script>'
ids = re.findall(r'id="([^"$]+)"', shell)  # 只查靜態骨架；程式裡的樣板同時只會畫一份
dup = sorted(set(i for i in ids if ids.count(i) > 1))
assert not dup, dup
assert re.search(r'<meta name="robots" content="noindex', html)
out = os.path.join(here, 'index.html')
open(out, 'w', encoding='utf-8').write(html)
print('ok', out, len(html.encode()), 'bytes')
