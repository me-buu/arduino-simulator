/* arduino-sim.js : หน้าจอของตัวจำลอง ใช้ร่วมกับ arduino-core.js
 * แต่ละหน้าตัวจำลองเรียก ArduinoSim.mount(DEMO) โดย DEMO คือค่าตั้งของตัวจำลองนั้น
 */
(function () {
  "use strict";
  const C = window.ArduinoCore;
  const LED_COLORS = { red: ["#FF3B2F", "#5E2A27"], yellow: ["#FFD21F", "#5B4B12"], green: ["#2FD563", "#1D4A2A"], blue: ["#3B8BFF", "#1B2D52"], white: ["#F4F7FA", "#4A4F55"] };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const KW = new Set("void int long float double bool boolean byte char uint8_t int8_t uint16_t int16_t uint32_t int32_t unsigned const volatile if else for while do switch case break continue return default true false".split(" "));
  const FN = new Set("setup loop pinMode digitalRead digitalWrite analogRead analogWrite delay delayMicroseconds millis map constrain min max abs Serial begin print println attachInterrupt digitalPinToInterrupt pulseIn".split(" "));
  const CS = new Set("HIGH LOW INPUT OUTPUT INPUT_PULLUP LED_BUILTIN PI A0 A1 A2 A3 A4 A5 FALLING RISING CHANGE".split(" "));
  function highlight(src) {
    // แยกคอมเมนต์ (ไม่นับ // ที่อยู่ในสตริง)
    let ci = -1, inS = false;
    for (let i = 0; i < src.length; i++) {
      if (src[i] === '"' && src[i - 1] !== "\\") inS = !inS;
      if (!inS && src[i] === "/" && src[i + 1] === "/") { ci = i; break; }
    }
    const code = ci >= 0 ? src.slice(0, ci) : src, com = ci >= 0 ? src.slice(ci) : "";
    const out = code.replace(/"(?:[^"\\]|\\.)*"|[A-Za-z_]\w*|\d+(?:\.\d+)?|[&<>]/g, (w) => {
      if (w === "&") return "&amp;"; if (w === "<") return "&lt;"; if (w === ">") return "&gt;";
      if (w[0] === '"') return `<span class="s">${esc(w)}</span>`;
      if (/^\d/.test(w)) return `<span class="n">${w}</span>`;
      if (KW.has(w) || CS.has(w)) return `<span class="k">${w}</span>`;
      if (FN.has(w)) return `<span class="f">${w}</span>`;
      return w;
    });
    return out + (com ? `<span class="c">${esc(com)}</span>` : "");
  }
  const el = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (html) e.innerHTML = html; return e; };

  function mount(D) {
    const root = document.getElementById("app");
    const hasBoard = D.board && D.board.length > 0;
    const inputs = (D.board || []).filter((w) => w.type !== "led");
    // ---------- โครงหน้า ----------
    root.innerHTML = `
      <div class="as-wrap">
        ${D.back ? `<a class="as-back" href="${D.back}">กลับไปหน้ารวมตัวจำลอง</a>` : ""}
        <h1>${esc(D.title)}</h1>
        <p class="as-lede">${D.lede || ""}</p>
        <section class="as-howto" aria-label="วิธีใช้">
          <h2>วิธีใช้</h2>
          <ol>
            <li>ทำภารกิจตามลำดับ เมื่อกดเลือกภารกิจ ตัวจำลองจะเริ่มใหม่และตั้งค่าให้เอง</li>
            <li>กด <b>ทำบรรทัดถัดไป</b> ทีละครั้ง แถบสีเหลืองคือบรรทัดที่ Arduino กำลังจะทำ ป้ายสีท้ายบรรทัดคือผลของบรรทัดที่เพิ่งทำ (ป้ายเส้นประคือผลจากรอบก่อน)</li>
            <li>${hasBoard ? "ปรับอุปกรณ์บนบอร์ดสีเขียวได้ตลอดเวลา แล้วดูว่าค่าในหน่วยความจำและตารางด้านล่างเปลี่ยนอย่างไร" : "ดูค่าในหน่วยความจำและ Serial Monitor ทางขวา" + (D.trace ? " และตารางติดตามค่าด้านล่าง" : "")} กด <b>คัดลอกโค้ด</b> เพื่อนำโค้ดไปวางใน Tinkercad หรือ Arduino IDE</li>
          </ol>
        </section>
        <div class="as-tabs" role="tablist"></div>
        <div class="as-mission" id="asMission"></div>
        <div class="as-grid">
          <section class="as-panel" aria-label="โค้ด">
            <div class="as-codehead"><h2 id="asCodeTitle"></h2><span id="asEditBtns"></span></div>
            <div class="as-code" id="asCode" role="list"></div>
            <textarea class="as-editor" id="asEditor" spellcheck="false" hidden></textarea>
            <div class="as-err" id="asErr" role="alert"></div>
            <div class="as-status" id="asStatus" aria-live="polite"></div>
            <div class="as-controls sticky">
              <button class="as-btn primary" id="asStep">ทำบรรทัดถัดไป</button>
              <button class="as-btn" id="asToEnd"></button>
              <button class="as-btn" id="asRun">รันต่อเนื่อง</button>
              <button class="as-btn" id="asReset">เริ่มใหม่</button>
            </div>
          </section>
          <section class="as-side" aria-label="บอร์ดและหน่วยความจำ">
            ${hasBoard ? `<div class="as-board" id="asBoard"></div>` : ""}
            ${D.scope ? `<div class="as-panel"><h2>${esc(D.scope.title || "สัญญาณที่ขาตามเวลาจำลอง")}</h2><div id="asScope"></div></div>` : ""}
            <div class="as-panel"><h2>ค่าในหน่วยความจำ</h2><table class="as-vars"><tbody id="asVars"></tbody></table><div class="as-empty" id="asVarsEmpty">ยังไม่มีตัวแปร</div></div>
            ${D.serial ? `<div class="as-panel"><h2>Serial Monitor</h2><div class="as-serial" id="asSerial" aria-live="polite"></div></div>` : ""}
          </section>
        </div>
        ${D.trace ? `<section class="as-panel as-trace"><h2>${esc(D.trace.title || "ตารางติดตามค่า")}</h2><div class="as-scroll" id="asTraceBox"><table class="as-tt"><thead><tr>${D.trace.cols.map((c) => `<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody id="asTrace"></tbody></table><div class="as-empty" id="asTraceEmpty">${esc(D.trace.empty || "ยังไม่มีข้อมูล")}</div></div></section>` : ""}
        <p class="as-foot">${D.foot || "ตัวจำลองนี้ใช้ชนิดข้อมูลแบบเดียวกับ Arduino Uno เช่น int มีขนาด 16 บิต บอร์ดจริงทำคำสั่งเร็วกว่ามาก ตัวจำลองเดินช้าเพื่อให้เห็นทีละบรรทัด"}</p>
        <p class="as-foot as-lic">โค้ดของตัวจำลองเผยแพร่ภายใต้สัญญาอนุญาต MIT เนื้อหาและภารกิจเผยแพร่ภายใต้ CC BY 4.0 นำไปใช้และดัดแปลงได้โดยระบุที่มา</p>
      </div>
      <div class="as-dlg" id="asDlg" role="dialog" aria-modal="true" aria-labelledby="asDlgT">
        <div class="box">
          <h2 id="asDlgT">ทำนายก่อนตรวจเงื่อนไข</h2>
          <div id="asDlgQ"></div>
          <div class="expr" id="asDlgExpr"></div>
          <div class="vals" id="asDlgVals"></div>
          <div class="row" id="asTF"><button class="as-btn" id="asAnsT">จริง</button><button class="as-btn" id="asAnsF">เท็จ</button></div>
          <div class="row" id="asValRow" hidden><input class="as-valin" id="asValIn" type="text" inputmode="decimal" aria-label="ค่าที่ทำนาย" autocomplete="off"><button class="as-btn primary" id="asValOk">ตรวจคำตอบ</button></div>
          <div class="fb" id="asFb"></div>
          <div class="row"><button class="as-btn primary" id="asDlgGo" hidden>ทำต่อ</button></div>
        </div>
      </div>`;
    const $ = (id) => document.getElementById(id);

    // ---------- สถานะ ----------
    let mi = 0, M = null, code = "", machine = null, prog = null, timer = null, running = false;
    let lastSeen = {}, prevVals = {}, lastRow = null, score = { ok: 0, all: 0 }, editing = false;
    const widgetState = {};
    const bounceQ = {}, presses = {};
    let hist = [];
    const W = (i) => Object.assign({}, D.board[i], M && M.board && M.board[i] ? M.board[i] : {});

    // ---------- อุปกรณ์บนบอร์ด ----------
    function buildBoard() {
      if (!hasBoard) return;
      const b = $("asBoard"); b.innerHTML = "";
      D.board.forEach((w, i) => {
        const part = el("div", { class: "as-part" });
        const pinTxt = typeof w.pin === "string" ? w.pin : "ขา " + w.pin;
        if (w.type === "led") {
          const [on, off] = LED_COLORS[w.color || "red"];
          part.innerHTML = `<div class="as-led" id="asW${i}" style="--on:${on};--off:${off}" aria-label="${esc(w.label)}"></div><div class="lbl">${esc(w.label)}</div><div class="pin">${pinTxt}</div>`;
        } else if (w.type === "slide") {
          part.innerHTML = `<button class="as-slide" id="asW${i}" role="switch" aria-checked="false" aria-label="${esc(w.label)}"><span></span></button><div class="lbl">${esc(w.label)}</div><div class="as-lvl" id="asWL${i}"></div><div class="pin">${pinTxt}</div>`;
        } else if (w.type === "button") {
          part.innerHTML = `<div class="as-tact" id="asW${i}" role="button" tabindex="0" aria-pressed="false" aria-label="${esc(w.label)}"><span></span></div><div class="lbl">${esc(w.label)}</div><div class="as-lvl" id="asWL${i}"></div><label class="as-hold"><input type="checkbox" id="asWH${i}"> ค้างปุ่มไว้</label><div class="pin">${pinTxt}</div>`;
        } else if (w.type === "ldr" || w.type === "tmp36" || w.type === "ultrasonic") {
          part.className = "as-part as-pot-row";
          const rng = w.type === "ldr" ? [0, 100] : w.type === "tmp36" ? [-40, 125] : [2, 450];
          const pinLbl = w.type === "ultrasonic" ? `Trig ขา ${w.trig}, Echo ขา ${w.echo}` : pinTxt;
          part.innerHTML = `<div class="lbl"><label for="asW${i}">${esc(w.label)}</label></div><input class="as-pot" type="range" id="asW${i}" min="${rng[0]}" max="${rng[1]}" step="1"><div class="as-potval" id="asWL${i}"></div><div class="pin">${pinLbl}</div>`;
        } else if (w.type === "pot") {
          part.className = "as-part as-pot-row";
          part.innerHTML = `<div class="lbl"><label for="asW${i}">${esc(w.label)}</label></div><input class="as-pot" type="range" id="asW${i}" min="${w.min}" max="${w.max}" step="1"><div class="as-potval" id="asWL${i}"></div><div class="pin">${pinTxt}</div>`;
        }
        b.appendChild(part);
        if (w.type === "slide") $("asW" + i).addEventListener("click", () => { changeInput(i, widgetState[i] ? 0 : 1); renderBoard(); });
        if (["pot", "ldr", "tmp36", "ultrasonic"].includes(w.type)) $("asW" + i).addEventListener("input", (e) => { widgetState[i] = +e.target.value; renderBoard(); });
        if (w.type === "button") {
          const t = $("asW" + i);
          const set = (v) => { if (v === (widgetState[i] ? 1 : 0)) return; if (v) presses[i] = (presses[i] || 0) + 1; changeInput(i, v); renderBoard(); };
          t.addEventListener("pointerdown", (e) => { e.preventDefault(); t.setPointerCapture(e.pointerId); set(1); });
          const rel = () => { if (!$("asWH" + i).checked) set(0); };
          t.addEventListener("pointerup", rel); t.addEventListener("pointercancel", rel);
          t.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); set(1); } });
          t.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") rel(); });
          $("asWH" + i).addEventListener("change", (e) => set(e.target.checked ? 1 : 0));
        }
      });
    }
    const pinOf = (w) => (typeof w.pin === "string" ? C.CONSTS[w.pin].v : w.pin);
    const modeOf = (pin) => (machine && machine.pins[pin] ? machine.pins[pin].mode : null);
    // ระดับแรงดันที่ขาจากปุ่มหรือสวิตช์ (null = ขาลอย)
    function levelOf(i, state, mode) {
      const w = W(i);
      if (w.type === "slide") return state ? 1 : 0;
      if (w.type !== "button") return 0;
      if (state) return w.to === "5v" ? 1 : 0;
      if (w.resistor === "pulldown") return 0;
      if (w.resistor === "pullup" || mode === 2) return 1;
      return null;
    }
    function changeInput(i, v) {
      const w = W(i), pin = pinOf(w), mode = modeOf(pin);
      const from = levelOf(i, widgetState[i], mode), to = levelOf(i, v, mode);
      widgetState[i] = v;
      if (from === null || to === null || from === to) return;
      if (M.bounce && w.type === "button") {
        const n = 3 + 2 * Math.floor(Math.random() * 3);   // จำนวนครั้งที่เด้ง (คี่)
        const q = [];
        for (let k = 0; k < n; k++) q.push(k % 2 === 0 ? to : from);
        bounceQ[i] = q;
        let prev = from;
        for (const lv of q) { if (machine) machine.extEdge(pin, prev, lv); prev = lv; }
      } else if (machine) machine.extEdge(pin, from, to);
    }
    // photoresistor: ความสว่าง 0–100% ให้ความต้านทาน 200 kΩ (มืด) ถึง 1 kΩ (สว่าง) แบบลอการิทึม
    function ldrModel(w, light) {
      const r = 200000 * Math.pow(1000 / 200000, light / 100), rf = w.fixed || 10000;
      const v = w.position === "bottom" ? 5 * r / (r + rf) : 5 * rf / (r + rf);
      return { r, v, adc: Math.min(1023, Math.floor(v * 1024 / 5)) };
    }
    function tmpModel(t) { const v = 0.5 + 0.01 * t; return { v, adc: Math.min(1023, Math.max(0, Math.floor(v * 1024 / 5))) }; }
    function usModel(d) { return d > 400 ? 0 : Math.round(d * 2 / 0.0343); }
    function potAdc(w, v) { return Math.min(1023, Math.ceil((v - w.min) * 1023 / (w.max - w.min))); }
    const io = {
      digitalIn(pin, mode) {
        const i = D.board ? D.board.findIndex((w) => w.type !== "led" && pinOf(w) === pin) : -1;
        if (i < 0) return 0;
        const w = W(i), s = widgetState[i] || 0;
        if (w.type === "pot") return potAdc(w, s) >= 614 ? 1 : 0;
        if (bounceQ[i] && bounceQ[i].length) return bounceQ[i].shift();
        const lv = levelOf(i, s, mode);
        return lv === null ? (Math.random() < 0.5 ? 1 : 0) : lv;
      },
      analogIn(pin) {
        const i = D.board ? D.board.findIndex((w) => ["pot", "ldr", "tmp36"].includes(w.type) && pinOf(w) === pin) : -1;
        if (i < 0) return 0;
        const w = W(i), s = widgetState[i];
        let a = w.type === "pot" ? potAdc(w, s) : w.type === "ldr" ? ldrModel(w, s).adc : tmpModel(s).adc;
        if (w.noise) a += Math.round((Math.random() * 2 - 1) * w.noise);
        return Math.max(0, Math.min(1023, a));
      },
      pulseIn(pin) {
        const i = D.board ? D.board.findIndex((w) => w.type === "ultrasonic" && w.echo === pin) : -1;
        return i < 0 ? 0 : usModel(widgetState[i]);
      },
    };
    function renderBoard() {
      if (!hasBoard) return;
      D.board.forEach((w, i) => {
        const e = $("asW" + i);
        if (w.type === "led") {
          const p = machine ? machine.pins[pinOf(w)] : null;
          const on = p && p.mode === 1 && (p.pwm !== null ? p.pwm > 0 : p.out === 1);
          e.classList.toggle("on", !!on);
          e.style.opacity = p && p.pwm !== null ? String(0.35 + 0.65 * p.pwm / 255) : "";
        } else if (w.type === "slide") {
          e.setAttribute("aria-checked", widgetState[i] ? "true" : "false");
          $("asWL" + i).textContent = (widgetState[i] ? (w.on || "เปิด") : (w.off || "ปิด")) + " (" + (widgetState[i] ? "HIGH" : "LOW") + ")";
        } else if (w.type === "button") {
          e.classList.toggle("down", !!widgetState[i]);
          e.setAttribute("aria-pressed", widgetState[i] ? "true" : "false");
          $("asWH" + i).checked = !!widgetState[i] && $("asWH" + i).checked;
          const lv = levelOf(i, widgetState[i], modeOf(pinOf(w)));
          $("asWL" + i).textContent = `${widgetState[i] ? "กดอยู่" : "ปล่อย"}, ขา ${lv === null ? "ลอย" : lv ? "HIGH" : "LOW"}` + (presses[i] ? `, กดไป ${presses[i]} ครั้ง` : "");
        } else if (w.type === "ldr") {
          e.value = widgetState[i]; const m = ldrModel(W(i), widgetState[i]);
          $("asWL" + i).textContent = `${widgetState[i]}%, ความต้านทาน ${(m.r / 1000).toFixed(1)} kΩ, แรงดัน ${m.v.toFixed(2)} V (ADC ${m.adc}${W(i).noise ? " มีสัญญาณรบกวน" : ""})`;
        } else if (w.type === "tmp36") {
          e.value = widgetState[i]; const m = tmpModel(widgetState[i]);
          $("asWL" + i).textContent = `${widgetState[i]} °C, แรงดัน ${m.v.toFixed(3)} V (ADC ${m.adc})`;
        } else if (w.type === "ultrasonic") {
          e.value = widgetState[i]; const us = usModel(widgetState[i]);
          $("asWL" + i).textContent = us ? `วัตถุห่าง ${widgetState[i]} cm, เสียงไปกลับ ${us} µs` : `${widgetState[i]} cm เกินระยะ ไม่มีเสียงสะท้อน`;
        } else if (w.type === "pot") {
          e.value = widgetState[i];
          $("asWL" + i).textContent = `${widgetState[i]} ${w.unit || ""} (ADC ${potAdc(w, widgetState[i])})`;
        }
      });
    }

    // ---------- โค้ดและเครื่องจำลอง ----------
    function load(src) {
      stop();
      $("asErr").textContent = "";
      try { prog = C.parse(src); }
      catch (e) { $("asErr").textContent = "แปลโค้ดไม่ได้: " + e.message; machine = null; renderAll(); return false; }
      code = src;
      try { machine = new C.Machine(prog, io); }
      catch (e) { $("asErr").textContent = e.message; machine = null; }
      lastSeen = {}; prevVals = {}; lastRow = null; hist = [];
      for (const k in bounceQ) delete bounceQ[k];
      for (const k in presses) delete presses[k];
      if (D.serial) $("asSerial").textContent = "";
      if (D.trace) { $("asTrace").innerHTML = ""; $("asTraceEmpty").style.display = ""; }
      renderAll();
      return true;
    }
    function traceLine() {
      const t = D.trace;
      if (!t || !prog) return null;
      if (t.stmt) { const s = C.findFirst(prog, t.stmt); return s ? s.line : null; }
      return null;
    }
    function snapshotVars() {
      if (!machine) return;
      for (const v of machine.visibleVars()) lastSeen[v.name] = machine.readVar(v.name);
    }
    function captureRow(p) {
      const t = D.trace;
      if (!t || !p) return;
      const match = t.at === "loopEnd" ? p.kind === "loopEnd" : (p.line === traceLine() && (!t.on || p.kind === t.on));
      if (!match) return;
      const condLine = t.at === "loopEnd" ? null : p.line;
      const vals = t.cols.map((c) => {
        if (c.var) return lastSeen[c.var] !== undefined ? lastSeen[c.var] : "—";
        if (c.pin !== undefined) { const pn = machine.pins[c.pin]; return pn && pn.mode === 1 ? (pn.out ? "HIGH" : "LOW") : "—"; }
        if (c.cond) { const l = condLine || (c.stmt && C.findFirst(prog, c.stmt) ? C.findFirst(prog, c.stmt).line : null); return l && machine.lastCond[l] !== undefined ? (machine.lastCond[l] ? "จริง" : "เท็จ") : "—"; }
        if (c.iter) return machine.iter;
        if (c.n) return $("asTrace").rows.length + 1;
        if (c.time) return Math.round(machine.time) + " ms";
        if (c.presses !== undefined) return presses[c.presses] || 0;
        if (c.widget !== undefined) { const w = W(c.widget); return w.type === "button" ? (widgetState[c.widget] ? "กด" : "ปล่อย") : (widgetState[c.widget] ? "เปิด" : "ปิด"); }
        return "";
      });
      const key = vals.filter((_, i) => !t.cols[i].iter && !t.cols[i].n && !t.cols[i].nokey).join("|");
      if (t.dedupe && key === lastRow) return;
      lastRow = key;
      const tr = el("tr");
      const hlIdx = t.cols.findIndex((c) => c.hl);
      if (hlIdx >= 0 && (vals[hlIdx] === "จริง" || vals[hlIdx] === "HIGH")) tr.className = "hl";
      tr.innerHTML = vals.map((v) => `<td>${esc(v)}</td>`).join("");
      $("asTrace").appendChild(tr);
      while ($("asTrace").rows.length > 200) $("asTrace").deleteRow(0);
      $("asTraceEmpty").style.display = "none";
      const box = $("asTraceBox"); box.scrollTop = box.scrollHeight;
    }
    function doStep() {
      if (!machine || machine.done) return null;
      let p;
      try { p = machine.step(); }
      catch (e) { $("asErr").textContent = "เกิดข้อผิดพลาดขณะทำงาน: " + e.message; stop(); machine.done = true; renderAll(); return null; }
      if (p && p.kind === "irqEnter") machine.notes[p.line] = { t: `เกิดอินเทอร์รัปต์ พักไว้ตรงนี้ แล้วไปทำ ${p.isr}() ก่อน`, k: "false", seq: ++machine.seq };
      snapshotVars();
      captureRow(p);
      recordScope();
      return p;
    }

    // ---------- การทำนาย ----------
    function needPredict() { return M.predict && !running && machine && machine.pause && machine.pause.kind === "cond"; }
    function predictTarget() {
      if (!M.predictVars || running || !machine || !machine.pause || machine.pause.kind !== "stmt" || !machine.pause.node) return null;
      const s = machine.pause.node;
      let name = null;
      if (s.k === "decl" && s.vars[0].init) name = s.vars[0].name;
      else if (s.k === "expr" && s.e.k === "assign" && s.e.target.k === "var") name = s.e.target.name;
      return name && M.predictVars.includes(name) ? name : null;
    }
    function askValue(name) {
      return new Promise((resolve) => {
        const line = machine.pause.line;
        $("asDlgT").textContent = "ทำนายค่าก่อนทำบรรทัดนี้";
        $("asDlgQ").textContent = `หลังทำบรรทัดที่ ${line} ตัวแปร ${name} จะมีค่าเท่าใด`;
        $("asDlgExpr").textContent = code.split("\n")[line - 1].replace(/\/\/.*$/, "").trim();
        $("asDlgVals").textContent = "";
        $("asTF").hidden = true; $("asValRow").hidden = false;
        $("asValIn").value = ""; $("asFb").textContent = ""; $("asFb").className = "fb";
        $("asDlgGo").hidden = true; $("asValOk").disabled = false;
        $("asDlg").classList.add("open"); $("asValIn").focus();
        const submit = () => {
          const guess = $("asValIn").value.trim();
          if (!guess) { $("asValIn").focus(); return; }
          $("asValOk").onclick = null; $("asValIn").onkeydown = null;
          // ทำบรรทัดนี้ให้เสร็จ รวมถึงฟังก์ชันที่ถูกเรียกในบรรทัดนี้
          const depth = machine.frames.length;
          let p = doStep(), guard = 0;
          while (p && !machine.done && machine.frames.length > depth && guard++ < 2000) p = doStep();
          renderAll();
          if (!p) { $("asDlg").classList.remove("open"); resolve(false); return; }
          const actual = machine.readVar(name) !== null ? machine.readVar(name) : lastSeen[name];
          const num = (x) => (x !== null && x !== undefined && x !== "" && !isNaN(+x) ? +x : null);
          // ยอมรับความคลาดเคลื่อนตามจำนวนทศนิยมที่ตอบ เช่น ตอบ 2.5 ถือว่าถูกถ้าค่าจริงอยู่ระหว่าง 2.45 ถึง 2.55
          const dec = (guess.split(".")[1] || "").length;
          const tol = dec ? 0.5 * Math.pow(10, -dec) + 1e-9 : 1e-6;
          const ok = num(guess) !== null && num(actual) !== null ? Math.abs(num(guess) - num(actual)) <= tol : guess === actual;
          score.all++; if (ok) score.ok++;
          $("asFb").textContent = (ok ? "ถูกต้อง " : "ยังไม่ถูก ") + `${name} = ${actual}`;
          $("asFb").className = "fb " + (ok ? "ok" : "bad");
          $("asValOk").disabled = true;
          $("asDlgGo").hidden = false; $("asDlgGo").focus();
          $("asDlgGo").onclick = () => { $("asDlg").classList.remove("open"); renderMission(); resolve(true); };
        };
        $("asValOk").onclick = submit;
        $("asValIn").onkeydown = (e) => { if (e.key === "Enter") submit(); };
      });
    }
    function askPredict() {
      return new Promise((resolve) => {
        const node = machine.pause.node;
        $("asDlgT").textContent = "ทำนายก่อนตรวจเงื่อนไข";
        $("asDlgQ").textContent = "ด้วยค่าตัวแปรตอนนี้ เงื่อนไขต่อไปนี้เป็นจริงหรือเท็จ";
        $("asTF").hidden = false; $("asValRow").hidden = true;
        $("asDlgExpr").textContent = C.exprStr(node);
        const names = [...C.varsIn(node)].filter((n) => machine.readVar(n) !== null);
        $("asDlgVals").textContent = names.length ? "ค่าตอนนี้: " + names.map((n) => `${n} = ${machine.readVar(n)}`).join(", ") : "";
        $("asFb").textContent = ""; $("asFb").className = "fb";
        $("asDlgGo").hidden = true; $("asAnsT").disabled = false; $("asAnsF").disabled = false;
        $("asDlg").classList.add("open"); $("asAnsT").focus();
        const answer = (guess) => {
          $("asAnsT").onclick = $("asAnsF").onclick = null;
          const line = machine.pause.line;
          const p = doStep(); renderAll();
          if (!p) { $("asDlg").classList.remove("open"); resolve(false); return; }
          const r = machine.lastCond[line] === 1;
          score.all++; if (guess === r) score.ok++;
          const n = machine.notes[line];
          $("asFb").textContent = (guess === r ? "ถูกต้อง " : "ยังไม่ถูก ") + (n ? n.t : "");
          $("asFb").className = "fb " + (guess === r ? "ok" : "bad");
          $("asAnsT").disabled = $("asAnsF").disabled = true;
          $("asDlgGo").hidden = false; $("asDlgGo").focus();
          $("asDlgGo").onclick = () => { $("asDlg").classList.remove("open"); renderMission(); resolve(true); };
        };
        $("asAnsT").onclick = () => answer(true);
        $("asAnsF").onclick = () => answer(false);
      });
    }
    async function stepUser() {
      if (needPredict()) { await askPredict(); return; }
      const pv = predictTarget(); if (pv) { await askValue(pv); return; }
      doStep(); renderAll();
    }
    let busy = false;
    async function toEnd() {
      if (busy) return; busy = true; stop();
      const untilDone = machine && machine.loopEmpty;
      let guard = 0;
      try {
        while (machine && !machine.done && guard++ < 5000) {
          if (needPredict()) { await askPredict(); if (machine.done) break; continue; }
          const pv = predictTarget(); if (pv) { await askValue(pv); if (machine.done) break; continue; }
          const p = doStep();
          if (!p) break;
          if (!untilDone && p.kind === "loopEnd") break;
        }
        if (guard >= 5000) $("asErr").textContent = "ทำไปแล้ว 5,000 ขั้นยังไม่จบ โปรแกรมอาจวนไม่รู้จบ ตรวจเงื่อนไขของลูปดู";
      } finally { busy = false; renderAll(); }
    }
    function stop() { if (timer) clearTimeout(timer); timer = null; running = false; if ($("asRun")) $("asRun").textContent = "รันต่อเนื่อง"; }
    function run() {
      if (running) { stop(); return; }
      if (!machine || machine.done) return;
      running = true; $("asRun").textContent = "หยุด";
      const tick = () => {
        if (!running) return;
        const p = doStep(); renderAll();
        if (!p || machine.done) { stop(); return; }
        const base = 1000 / (M.speed || 5);
        const wait = M.realtime && machine.lastDelayMs ? Math.max(base, machine.lastDelayMs * M.realtime) : base;
        timer = setTimeout(tick, wait);
      };
      timer = setTimeout(tick, 0);
    }

    // ---------- แสดงผล ----------
    function renderCode() {
      const box = $("asCode");
      const lines = code.split("\n");
      const next = machine && machine.pause ? machine.pause.line : -1;
      box.innerHTML = "";
      lines.forEach((t, i) => {
        const ln = i + 1;
        const row = el("div", { class: "as-ln" + (ln === next ? " next" : ""), role: "listitem" });
        const n = machine ? machine.notes[ln] : null;
        const stale = n && n.seq <= machine.staleSeq;
        const note = n ? `<span class="as-note ${stale ? "old" : n.k}">${esc(n.t)}</span>` : "";
        row.innerHTML = `<span class="no">${ln}</span><span class="pc">${ln === next ? "▶" : ""}</span><span class="src">${highlight(t)}${note}</span>`;
        box.appendChild(row);
      });
      const cur = box.querySelector(".next");
      if (cur && !running) cur.scrollIntoView({ block: "nearest" });
    }
    function renderVars() {
      const tb = $("asVars"); tb.innerHTML = "";
      const list = machine ? machine.visibleVars() : [];
      if (machine && machine.done && !list.length && Object.keys(lastSeen).length) {
        // โปรแกรมจบแล้ว ตัวแปรเฉพาะที่หายไป แสดงค่าสุดท้ายแทน
        for (const k in lastSeen) { const tr = el("tr"); tr.innerHTML = `<th>${esc(k)}</th><td class="scope">ค่าสุดท้ายก่อนตัวแปรถูกลบ</td><td class="val">${esc(lastSeen[k])}</td>`; tb.appendChild(tr); }
        $("asVarsEmpty").style.display = "none";
        return;
      }
      $("asVarsEmpty").style.display = list.length ? "none" : "";
      for (const v of list) {
        const val = machine.readVar(v.name);
        const key = v.scope + ":" + v.name;
        const tr = el("tr");
        tr.innerHTML = `<th>${esc(v.name)}</th><td class="scope">${esc(v.ty)}, ${esc(v.scope)}</td><td class="val">${esc(val)}</td>`;
        if (prevVals[key] !== undefined && prevVals[key] !== val) tr.classList.add("flash");
        prevVals[key] = val;
        tb.appendChild(tr);
      }
    }
    function renderStatus() {
      let s = "";
      if (!machine) s = "";
      else if (machine.done) s = machine.loopEmpty ? "โปรแกรมทำงานใน setup() เสร็จแล้ว loop() ว่างจึงไม่มีอะไรทำต่อ กด “เริ่มใหม่” เพื่อดูอีกครั้ง" : "โปรแกรมหยุดทำงาน";
      else if (machine.pause && machine.pause.kind === "idle") s = "setup() เสร็จแล้ว loop() ว่าง กดอีกครั้งเพื่อจบ";
      else s = (machine.inISR ? "กำลังทำ ISR (งานใน loop() ถูกพักไว้) " : "") + `loop() ทำไปแล้ว ${machine.iter} รอบ` + (machine.time ? `, เวลาจำลอง ${Math.round(machine.time)} ms` : "");
      $("asStatus").textContent = s;
      const dis = !machine || machine.done || editing;
      $("asStep").disabled = $("asToEnd").disabled = $("asRun").disabled = dis;
      $("asToEnd").textContent = machine && machine.loopEmpty ? "ทำจนจบโปรแกรม" : "ทำจนจบรอบ loop()";
    }
    function recordScope() {
      if (!D.scope || !machine) return;
      const v = D.scope.pins.map((p) => { const pn = machine.pins[p]; return pn && pn.mode === 1 ? pn.out : 0; });
      const last = hist[hist.length - 1];
      if (!last || last.t !== machine.time || last.v.join() !== v.join()) hist.push({ t: machine.time, v });
      if (hist.length > 2000) hist = hist.slice(-1500);
    }
    function renderScope() {
      if (!D.scope) return;
      const box = $("asScope"), Wd = 520, rowH = 60, pad = 34, span = D.scope.ms || 4000;
      const pins = D.scope.pins, H = pins.length * rowH + 26;
      const tEnd = Math.max(span, machine ? machine.time : 0), tStart = tEnd - span;
      const X = (t) => pad + (t - tStart) / span * (Wd - pad - 8);
      let svg = `<svg viewBox="0 0 ${Wd} ${H}" width="100%" role="img" aria-label="กราฟสัญญาณที่ขาตามเวลา" style="display:block">`;
      pins.forEach((p, k) => {
        const y0 = 10 + k * rowH, yH = y0 + 6, yL = y0 + rowH - 14;
        svg += `<text x="2" y="${(yH + yL) / 2 + 4}" font-size="12" fill="var(--muted)" font-family="IBM Plex Mono, monospace">${C.pinName(p)}</text>`;
        let d = "", prevY = null;
        const pts = hist.filter((h) => h.t >= tStart - span);
        pts.forEach((h, j) => {
          const x = Math.max(pad, X(h.t)), y = h.v[k] ? yH : yL;
          if (j === 0) d += `M${x},${y}`; else d += `L${x},${prevY}L${x},${y}`;
          prevY = y;
        });
        if (prevY !== null) d += `L${X(machine.time)},${prevY}`;
        svg += `<line x1="${pad}" y1="${yL}" x2="${Wd - 8}" y2="${yL}" stroke="var(--line)"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2"/>`;
        svg += `<text x="${pad - 4}" y="${yH + 4}" font-size="10" text-anchor="end" fill="var(--muted)">H</text><text x="${pad - 4}" y="${yL + 4}" font-size="10" text-anchor="end" fill="var(--muted)">L</text>`;
      });
      for (let t = Math.ceil(tStart / 1000) * 1000; t <= tEnd; t += 1000) {
        if (t < 0) continue;
        svg += `<line x1="${X(t)}" y1="${H - 20}" x2="${X(t)}" y2="${H - 16}" stroke="var(--muted)"/><text x="${X(t)}" y="${H - 4}" font-size="11" text-anchor="middle" fill="var(--muted)">${t / 1000} s</text>`;
      }
      box.innerHTML = svg + "</svg>";
    }
    function renderAll() {
      renderCode(); renderVars(); renderBoard(); renderStatus(); renderScope();
      if (D.serial && machine) { const s = $("asSerial"); s.textContent = machine.serialOut.slice(-3000); s.scrollTop = s.scrollHeight; }
    }
    function renderMission() {
      $("asMission").innerHTML = `<p>${M.text}</p>` + (M.q ? `<p class="q">${M.q}</p>` : "") +
        ((M.predict || M.predictVars) && score.all ? `<p class="score">ทำนายถูก ${score.ok} จาก ${score.all} ครั้ง</p>` : "");
    }

    // ---------- แก้โค้ด ----------
    function copyCode() {
      const btn = $("asCopy");
      const done = () => { btn.textContent = "คัดลอกแล้ว"; setTimeout(() => { btn.textContent = "คัดลอกโค้ด"; }, 1500); };
      const fallback = () => { const t = el("textarea"); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(code).then(done, fallback); else fallback();
    }
    function renderEditBtns() {
      const box = $("asEditBtns");
      box.innerHTML = "";
      if (!editing) { const cp = el("button", { class: "as-btn", id: "asCopy" }, "คัดลอกโค้ด"); cp.onclick = copyCode; box.append(cp, " "); }
      if (!M.editable) return;
      if (!editing) {
        const b = el("button", { class: "as-btn" }, "แก้โค้ด");
        b.onclick = () => { stop(); editing = true; $("asEditor").value = code; $("asEditor").hidden = false; $("asCode").hidden = true; renderEditBtns(); renderStatus(); $("asEditor").focus(); };
        box.appendChild(b);
      } else {
        const ok = el("button", { class: "as-btn primary" }, "ใช้โค้ดนี้");
        ok.onclick = () => { if (load($("asEditor").value)) { editing = false; $("asEditor").hidden = true; $("asCode").hidden = false; renderEditBtns(); renderAll(); } };
        const back = el("button", { class: "as-btn" }, "คืนค่าโค้ดเดิม");
        back.onclick = () => { $("asEditor").value = M.code; };
        box.append(ok, " ", back);
      }
    }

    // ---------- ภารกิจ ----------
    function selectMission(i) {
      mi = i; M = D.missions[i]; score = { ok: 0, all: 0 }; editing = false;
      document.querySelectorAll(".as-tab").forEach((t, j) => t.setAttribute("aria-selected", j === i ? "true" : "false"));
      $("asCodeTitle").textContent = M.title;
      (D.board || []).forEach((w, j) => {
        const init = M.inputs && M.inputs[j] !== undefined ? M.inputs[j] : (w.init !== undefined ? w.init : (w.type === "pot" ? w.min : w.type === "ultrasonic" ? 100 : w.type === "tmp36" ? 25 : w.type === "ldr" ? 50 : 0));
        widgetState[j] = init;
        if (w.type === "button" && $("asWH" + j)) $("asWH" + j).checked = false;
      });
      $("asEditor").hidden = true; $("asCode").hidden = false;
      renderMission(); renderEditBtns();
      load(M.code);
    }
    const tabs = root.querySelector(".as-tabs");
    D.missions.forEach((m, i) => {
      const t = el("button", { class: "as-tab", role: "tab" }, esc(m.tab || "ภารกิจ " + (i + 1)));
      t.onclick = () => selectMission(i);
      tabs.appendChild(t);
    });
    $("asStep").onclick = () => { stop(); stepUser(); };
    $("asToEnd").onclick = () => toEnd();
    $("asRun").onclick = run;
    $("asReset").onclick = () => { score = { ok: 0, all: 0 }; renderMission(); load(code); };
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("asDlg").classList.contains("open")) { /* ต้องตอบก่อน จึงไม่ปิด */ } });
    buildBoard();
    selectMission(0);
    return { stop };
  }
  window.ArduinoSim = { mount };
})();
