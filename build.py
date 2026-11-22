# รวม engine เข้าไปในหน้าตัวจำลองแต่ละหน้า ให้เป็นไฟล์เดียวที่เปิดได้โดยไม่ต้องมีโฟลเดอร์ engine
# ใช้: python3 build.py   ได้ผลในโฟลเดอร์ dist/
import os, re
root = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(root, 'engine/arduino-sim.css'), encoding='utf-8').read()
core = open(os.path.join(root, 'engine/arduino-core.js'), encoding='utf-8').read()
ui = open(os.path.join(root, 'engine/arduino-sim.js'), encoding='utf-8').read()
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
for name in sorted(os.listdir(os.path.join(root, 'demos'))):
    if not name.endswith('.html'): continue
    s = open(os.path.join(root, 'demos', name), encoding='utf-8').read()
    s = s.replace('<link rel="stylesheet" href="../engine/arduino-sim.css">', '<style>\n' + css + '</style>')
    s = s.replace('<script src="../engine/arduino-core.js"></script>', '<script>\n' + core + '</script>')
    s = s.replace('<script src="../engine/arduino-sim.js"></script>', '<script>\n' + ui + '</script>')
    s = re.sub(r'\s*back: "\.\./index\.html",', '', s)
    open(os.path.join(root, 'dist', name), 'w', encoding='utf-8').write(s)
    print('dist/' + name)

# ---------- ไฟล์เดียวรวมทุกตัวจำลอง (หน้าหลัก + ตัวจำลองทุกตัว) ----------
idx = open(os.path.join(root, 'index.html'), encoding='utf-8').read()
head = idx.split('<body>')[0].replace('<link rel="stylesheet" href="engine/arduino-sim.css">', '<style>\n' + css + '</style>')
body = idx.split('<body>')[1].split('</body>')[0]
hero_script = re.search(r'<script>.*?</script>', body, re.S).group(0)
body = body.replace(hero_script, '')
body = re.sub(r'href="demos/([a-z0-9-]+)\.html"', r'href="#\1"', body)
configs = []
for name in sorted(os.listdir(os.path.join(root, 'demos'))):
    if not name.endswith('.html'): continue
    s = open(os.path.join(root, 'demos', name), encoding='utf-8').read()
    m = re.search(r'ArduinoSim\.mount\((\{.*\})\);\s*</script>', s, re.S)
    cfg = m.group(1).replace('back: "../index.html"', 'back: "#"')
    configs.append(f'  "{name[:-5]}": {cfg},')
spa = head + '<body>\n<div id="home">\n' + body + '\n</div>\n<div id="app" hidden></div>\n' + hero_script + \
  '\n<script>\n' + core + '</script>\n<script>\n' + ui + '</script>\n<script>\n' + \
  '// ตัวจำลองทุกตัว เปิดด้วย #ชื่อ เช่น #for-loop\nconst DEMOS = {\n' + '\n'.join(configs) + '\n};\n' + '''
const home = document.getElementById("home"), app = document.getElementById("app");
const baseTitle = document.title;
let current = null;
function route() {
  const id = location.hash.slice(1);
  if (current) { current.stop(); current = null; }
  if (DEMOS[id]) {
    home.hidden = true; app.hidden = false;
    current = ArduinoSim.mount(DEMOS[id]);
    document.title = DEMOS[id].title + ": " + baseTitle;
    window.scrollTo(0, 0);
  } else {
    app.hidden = true; app.innerHTML = ""; home.hidden = false;
    document.title = baseTitle;
  }
}
window.addEventListener("hashchange", route);
route();
</script>
</body>
</html>
'''
open(os.path.join(root, 'dist', 'arduino-demos.html'), 'w', encoding='utf-8').write(spa)
print('dist/arduino-demos.html')
