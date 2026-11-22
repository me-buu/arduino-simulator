/* arduino-core.js
 * ตัวแปลภาษา Arduino (C++ ชุดย่อย) สำหรับตัวจำลองการสอน
 * - เดินทีละคำสั่งด้วย generator
 * - ชนิดข้อมูลตาม Arduino Uno: int 16 บิต, long 32 บิต, float 32 บิต (double = float)
 * - ไม่ขึ้นกับหน้าเว็บ จึงทดสอบด้วย Node.js ได้
 */
(function (global) {
  "use strict";

  // ---------------- ข้อผิดพลาด ----------------
  class SimError extends Error {
    constructor(msg, line) { super(line ? `บรรทัด ${line}: ${msg}` : msg); this.line = line; }
  }

  // ---------------- ตัวแยกคำ ----------------
  const OPS = ["<<=", ">>=", "==", "!=", "<=", ">=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=",
    "&=", "|=", "^=", "<<", ">>", "+", "-", "*", "/", "%", "<", ">", "=", "!", "&", "|", "^", "~",
    "?", ":", ";", ",", ".", "(", ")", "{", "}", "[", "]"];
  function tokenize(src) {
    const toks = [];
    let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === "\n") { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (src.startsWith("//", i)) { while (i < src.length && src[i] !== "\n") i++; continue; }
      if (src.startsWith("/*", i)) {
        const j = src.indexOf("*/", i + 2);
        const end = j < 0 ? src.length : j + 2;
        for (let k = i; k < end; k++) if (src[k] === "\n") line++;
        i = end; continue;
      }
      if (c === "#") {
        let j = i; while (j < src.length && src[j] !== "\n") j++;
        const d = src.slice(i, j).trim();
        if (!/^#include\b/.test(d)) throw new SimError("ตัวจำลองนี้ยังไม่รองรับ " + d.split(/\s/)[0] + " ให้ใช้ const แทน", line);
        i = j; continue;
      }
      let m;
      const rest = src.slice(i, i + 64);
      if ((m = rest.match(/^0[xX][0-9a-fA-F]+[uUlL]*/)) || (m = rest.match(/^(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?[fFuUlL]*/))) {
        toks.push({ k: "num", v: m[0], line }); i += m[0].length; continue;
      }
      if ((m = rest.match(/^[A-Za-z_]\w*/))) { toks.push({ k: "id", v: m[0], line }); i += m[0].length; continue; }
      if (c === '"') {
        let j = i + 1, s = "";
        while (j < src.length && src[j] !== '"') {
          if (src[j] === "\\") { const e = src[j + 1]; s += e === "n" ? "\n" : e === "t" ? "\t" : e; j += 2; }
          else { if (src[j] === "\n") throw new SimError("ข้อความในเครื่องหมาย \" ไม่ได้ปิด", line); s += src[j]; j++; }
        }
        if (j >= src.length) throw new SimError("ข้อความในเครื่องหมาย \" ไม่ได้ปิด", line);
        toks.push({ k: "str", v: s, line }); i = j + 1; continue;
      }
      if (c === "'") {
        let j = i + 1, ch = src[j];
        if (ch === "\\") { const e = src[j + 1]; ch = e === "n" ? "\n" : e === "t" ? "\t" : e === "0" ? "\0" : e; j += 2; } else j += 1;
        if (src[j] !== "'") throw new SimError("ตัวอักษรในเครื่องหมาย ' ไม่ถูกต้อง", line);
        toks.push({ k: "char", v: ch.charCodeAt(0), line }); i = j + 1; continue;
      }
      const op = OPS.find((o) => src.startsWith(o, i));
      if (op) { toks.push({ k: "op", v: op, line }); i += op.length; continue; }
      throw new SimError(`อ่านตัวอักษร "${c}" ไม่ได้`, line);
    }
    toks.push({ k: "eof", v: "", line });
    return toks;
  }

  // ---------------- ตัวแยกโครงสร้าง ----------------
  const TYPE_WORDS = new Set(["void", "int", "long", "float", "double", "bool", "boolean", "byte", "char", "unsigned", "short", "word", "const", "volatile", "static"]);
  function parse(src) {
    const t = tokenize(src);
    let p = 0;
    const peek = (o = 0) => t[p + o];
    const at = (v) => t[p].v === v && (t[p].k === "op" || t[p].k === "id");
    const eat = (v) => { if (at(v)) { p++; return true; } return false; };
    const expect = (v, what) => {
      if (!eat(v)) {
        const tok = t[p];
        const ln = v === ";" && p > 0 ? t[p - 1].line : tok.line;
        throw new SimError(what || `ขาดเครื่องหมาย ${v}`, ln);
      }
    };
    const isTypeStart = () => t[p].k === "id" && TYPE_WORDS.has(t[p].v);

    function parseType() {
      let isConst = false, unsigned = false, base = null;
      while (t[p].k === "id" && TYPE_WORDS.has(t[p].v)) {
        const w = t[p].v; p++;
        if (w === "const") isConst = true;
        else if (w === "volatile" || w === "static") { /* ไม่มีผลในตัวจำลอง */ }
        else if (w === "unsigned") unsigned = true;
        else base = w;
      }
      if (!base) base = unsigned ? "int" : null;
      if (!base) throw new SimError("ไม่พบชนิดข้อมูล", t[p].line);
      let ty = { int: "int", short: "int", long: "long", float: "float", double: "float", bool: "bool", boolean: "bool", byte: "byte", char: "char", void: "void", word: "uint" }[base];
      if (unsigned) ty = ty === "long" ? "ulong" : ty === "char" ? "byte" : "uint";
      return { ty, isConst };
    }
    function ident(what) {
      const tok = t[p];
      if (tok.k !== "id") throw new SimError(what || "ต้องการชื่อตัวแปร", tok.line);
      p++; return tok.v;
    }

    function parseProgram() {
      const globals = [], funcs = {};
      while (t[p].k !== "eof") {
        const line = t[p].line;
        if (!isTypeStart()) throw new SimError(`ไม่เข้าใจ "${t[p].v}" ต้องเป็นการประกาศตัวแปรหรือฟังก์ชัน`, line);
        const save = p;
        const type = parseType();
        const name = ident();
        if (at("(")) {
          p++;
          const params = [];
          if (!at(")")) {
            if (at("void") && peek(1).v === ")") p++;
            else do { const pt = parseType(); params.push({ name: ident(), ty: pt.ty }); } while (eat(","));
          }
          expect(")");
          const body = parseBlock();
          funcs[name] = { name, ty: type.ty, params, body, line, endLine: body.endLine };
        } else {
          p = save;
          globals.push(parseDecl());
        }
      }
      return { globals, funcs };
    }
    function parseDecl() {
      const line = t[p].line;
      const type = parseType();
      const vars = [];
      do {
        const name = ident();
        let size = null, init = null;
        if (eat("[")) { size = at("]") ? null : parseExpr(); expect("]"); size = size || { k: "auto" }; }
        if (eat("=")) {
          if (size && eat("{")) {
            const list = [];
            if (!at("}")) do { list.push(parseAssign()); } while (eat(",") && !at("}"));
            expect("}");
            init = { k: "list", items: list };
          } else init = parseAssign();
        }
        vars.push({ name, size, init });
      } while (eat(","));
      expect(";");
      return { k: "decl", line, ty: type.ty, isConst: type.isConst, vars };
    }
    function parseBlock() {
      const line = t[p].line;
      expect("{", "ขาดเครื่องหมาย {");
      const body = [];
      while (!at("}")) {
        if (t[p].k === "eof") throw new SimError("ขาดเครื่องหมาย } ปิดท้าย", line);
        body.push(parseStmt());
      }
      const endLine = t[p].line; p++;
      return { k: "block", line, body, endLine };
    }
    function parseStmt() {
      const tok = t[p], line = tok.line;
      if (at("{")) return parseBlock();
      if (at(";")) { p++; return { k: "empty", line }; }
      if (isTypeStart()) return parseDecl();
      if (tok.k === "id") {
        switch (tok.v) {
          case "if": {
            p++; expect("("); const cond = parseExpr(); expect(")");
            const then = parseStmt();
            let els = null;
            if (eat("else")) els = parseStmt();
            return { k: "if", line, cond, then, els };
          }
          case "while": { p++; expect("("); const cond = parseExpr(); expect(")"); return { k: "while", line, cond, body: parseStmt() }; }
          case "do": {
            p++; const body = parseStmt(); const wl = t[p].line;
            expect("while", "ขาดคำว่า while"); expect("("); const cond = parseExpr(); expect(")"); expect(";");
            return { k: "do", line, body, cond, condLine: wl };
          }
          case "for": {
            p++; expect("(");
            let init = null;
            if (isTypeStart()) init = parseDecl();
            else { if (!at(";")) init = { k: "expr", line, e: parseExpr() }; expect(";"); }
            const cond = at(";") ? null : parseExpr(); expect(";");
            const upd = [];
            if (!at(")")) do { upd.push(parseAssign()); } while (eat(","));
            expect(")");
            return { k: "for", line, init, cond, upd, body: parseStmt() };
          }
          case "switch": {
            p++; expect("("); const e = parseExpr(); expect(")"); expect("{");
            const items = [];
            while (!at("}")) {
              const l2 = t[p].line;
              if (eat("case")) { const v = parseExpr(); expect(":"); items.push({ k: "case", line: l2, v }); }
              else if (eat("default")) { expect(":"); items.push({ k: "default", line: l2 }); }
              else items.push(parseStmt());
            }
            const endLine = t[p].line; p++;
            return { k: "switch", line, e, items, endLine };
          }
          case "break": p++; expect(";"); return { k: "break", line };
          case "continue": p++; expect(";"); return { k: "continue", line };
          case "return": { p++; const e = at(";") ? null : parseExpr(); expect(";"); return { k: "return", line, e }; }
          case "else": throw new SimError("พบ else ที่ไม่มี if คู่กัน", line);
        }
      }
      const e = parseExpr();
      expect(";");
      return { k: "expr", line, e };
    }
    // นิพจน์
    function parseExpr() {
      let e = parseAssign();
      while (at(",")) { p++; e = { k: "comma", a: e, b: parseAssign(), line: e.line }; }
      return e;
    }
    const ASSIGN = new Set(["=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="]);
    function parseAssign() {
      const left = parseTernary();
      if (t[p].k === "op" && ASSIGN.has(t[p].v)) {
        const op = t[p].v, line = t[p].line; p++;
        if (left.k !== "var" && left.k !== "index") throw new SimError("ด้านซ้ายของ " + op + " ต้องเป็นตัวแปร", line);
        return { k: "assign", op, target: left, value: parseAssign(), line };
      }
      return left;
    }
    function parseTernary() {
      const c = parseBin(0);
      if (at("?")) { p++; const a = parseAssign(); expect(":"); const b = parseAssign(); return { k: "tern", c, a, b, line: c.line }; }
      return c;
    }
    const LEVELS = [["||"], ["&&"], ["|"], ["^"], ["&"], ["==", "!="], ["<", ">", "<=", ">="], ["<<", ">>"], ["+", "-"], ["*", "/", "%"]];
    function parseBin(lv) {
      if (lv >= LEVELS.length) return parseUnary();
      let left = parseBin(lv + 1);
      while (t[p].k === "op" && LEVELS[lv].includes(t[p].v)) {
        const op = t[p].v, line = t[p].line; p++;
        left = { k: "bin", op, a: left, b: parseBin(lv + 1), line };
      }
      return left;
    }
    function parseUnary() {
      const tok = t[p];
      if (tok.k === "op" && ["!", "-", "+", "~"].includes(tok.v)) { p++; return { k: "un", op: tok.v, a: parseUnary(), line: tok.line }; }
      if (tok.k === "op" && (tok.v === "++" || tok.v === "--")) { p++; const a = parseUnary(); return { k: "inc", op: tok.v, pre: true, a, line: tok.line }; }
      if (tok.k === "op" && tok.v === "(" && t[p + 1].k === "id" && TYPE_WORDS.has(t[p + 1].v)) {
        p++; const ty = parseType(); expect(")"); return { k: "cast", ty: ty.ty, a: parseUnary(), line: tok.line };
      }
      return parsePostfix();
    }
    function parsePostfix() {
      let e = parsePrimary();
      for (;;) {
        if (at("(")) {
          const line = t[p].line; p++;
          const args = [];
          if (!at(")")) do { args.push(parseAssign()); } while (eat(","));
          expect(")");
          if (e.k !== "var") throw new SimError("เรียกฟังก์ชันได้เฉพาะชื่อฟังก์ชัน", line);
          e = { k: "call", name: e.name, args, line };
        } else if (at("[")) { const line = t[p].line; p++; const i = parseExpr(); expect("]"); e = { k: "index", arr: e, i, line }; }
        else if (at(".")) { p++; const m = ident("ต้องการชื่อหลังเครื่องหมาย ."); e = { k: "var", name: e.name + "." + m, line: e.line }; }
        else if (at("++") || at("--")) { const op = t[p].v; p++; e = { k: "inc", op, pre: false, a: e, line: e.line }; }
        else break;
      }
      return e;
    }
    function parsePrimary() {
      const tok = t[p];
      if (tok.k === "num") { p++; return { k: "num", raw: tok.v, line: tok.line }; }
      if (tok.k === "char") { p++; return { k: "lit", v: { t: "char", v: tok.v }, line: tok.line }; }
      if (tok.k === "str") { p++; return { k: "str", v: tok.v, line: tok.line }; }
      if (tok.k === "id") { p++; return { k: "var", name: tok.v, line: tok.line }; }
      if (eat("(")) { const e = parseExpr(); expect(")"); return e; }
      throw new SimError(tok.k === "eof" ? "โค้ดจบก่อนเวลา" : `ไม่เข้าใจ "${tok.v}"`, tok.line);
    }
    const prog = parseProgram();
    if (!prog.funcs.setup) throw new SimError("ไม่พบฟังก์ชัน setup()");
    if (!prog.funcs.loop) throw new SimError("ไม่พบฟังก์ชัน loop()");
    return prog;
  }

  // ---------------- ชนิดข้อมูลและเลขคณิตแบบ AVR ----------------
  const RANK = { int: 1, uint: 2, long: 3, ulong: 4, float: 5 };
  const f32 = Math.fround;
  function wrap(ty, x) {
    switch (ty) {
      case "float": return f32(x);
      case "bool": return x ? 1 : 0;
      case "byte": return mod(Math.trunc(x), 256);
      case "char": { const v = mod(Math.trunc(x), 256); return v >= 128 ? v - 256 : v; }
      case "int": { const v = mod(Math.trunc(x), 65536); return v >= 32768 ? v - 65536 : v; }
      case "uint": return mod(Math.trunc(x), 65536);
      case "long": { const v = mod(Math.trunc(x), 4294967296); return v >= 2147483648 ? v - 4294967296 : v; }
      case "ulong": return mod(Math.trunc(x), 4294967296);
    }
    return x;
  }
  function mod(a, n) {
    if (Math.abs(a) > 9007199254740991) return Number(((BigInt(Math.round(a)) % BigInt(n)) + BigInt(n)) % BigInt(n));
    return ((a % n) + n) % n;
  }
  const promote = (ty) => (ty === "bool" || ty === "byte" || ty === "char") ? "int" : ty;
  function common(a, b) {
    const x = promote(a), y = promote(b);
    return RANK[x] >= RANK[y] ? x : y;
  }
  const V = (t, v) => ({ t, v });
  function conv(val, ty) {
    if (val.t === "str") throw new SimError("ใช้ข้อความในการคำนวณไม่ได้");
    if (ty === "float") return V("float", f32(val.v));
    if (ty === "bool") return V("bool", val.v !== 0 ? 1 : 0);
    return V(ty, wrap(ty, val.t === "float" ? Math.trunc(val.v) : val.v));
  }
  function mulExact(a, b) {
    const r = a * b;
    if (Math.abs(r) <= 9007199254740991) return r;
    return Number(BigInt(Math.trunc(a)) * BigInt(Math.trunc(b)) % 18446744073709551616n);
  }
  function arith(op, a, b, line) {
    const ty = common(a.t, b.t);
    const x = conv(a, ty).v, y = conv(b, ty).v;
    if (ty === "float") {
      switch (op) {
        case "+": return V(ty, f32(x + y));
        case "-": return V(ty, f32(x - y));
        case "*": return V(ty, f32(x * y));
        case "/": return V(ty, f32(x / y));
        case "%": throw new SimError("ใช้ % กับเลขทศนิยมไม่ได้", line);
      }
    }
    switch (op) {
      case "+": return V(ty, wrap(ty, x + y));
      case "-": return V(ty, wrap(ty, x - y));
      case "*": return V(ty, wrap(ty, mulExact(x, y)));
      case "/": if (y === 0) throw new SimError("หารด้วยศูนย์", line); return V(ty, wrap(ty, Math.trunc(x / y)));
      case "%": if (y === 0) throw new SimError("หารด้วยศูนย์", line); return V(ty, wrap(ty, x % y));
      case "&": return V(ty, wrap(ty, Number(BigInt(x) & BigInt(y))));
      case "|": return V(ty, wrap(ty, Number(BigInt(x) | BigInt(y))));
      case "^": return V(ty, wrap(ty, Number(BigInt(x) ^ BigInt(y))));
      case "<<": return V(promote(a.t), wrap(promote(a.t), x * Math.pow(2, y)));
      case ">>": return V(promote(a.t), wrap(promote(a.t), Math.floor(conv(a, promote(a.t)).v / Math.pow(2, y))));
    }
    throw new SimError("ยังไม่รองรับตัวดำเนินการ " + op, line);
  }
  function compare(op, a, b) {
    const ty = common(a.t, b.t);
    const x = conv(a, ty).v, y = conv(b, ty).v;
    const r = { "==": x === y, "!=": x !== y, "<": x < y, ">": x > y, "<=": x <= y, ">=": x >= y }[op];
    return V("bool", r ? 1 : 0);
  }
  function numLiteral(raw, line) {
    let s = raw, suf = "";
    const m = s.match(/[fFuUlL]+$/);
    if (m && !/^0[xX]/.test(s)) { suf = m[0].toLowerCase(); s = s.slice(0, -m[0].length); }
    else if (m) { suf = m[0].toLowerCase(); s = s.slice(0, -m[0].length); }
    if (/[.eE]/.test(s) && !/^0[xX]/.test(s) || suf.includes("f")) return V("float", f32(parseFloat(s)));
    const n = /^0[xX]/.test(s) ? parseInt(s, 16) : parseInt(s, 10);
    const u = suf.includes("u"), l = suf.includes("l");
    let ty;
    if (u && l) ty = "ulong";
    else if (l) ty = n <= 2147483647 ? "long" : "ulong";
    else if (u) ty = n <= 65535 ? "uint" : "ulong";
    else ty = n <= 32767 ? "int" : n <= 2147483647 ? "long" : "ulong";
    if (n > 4294967295) throw new SimError("ตัวเลขใหญ่เกินไป", line);
    return V(ty, n);
  }
  const truthy = (v) => v.v !== 0;

  // การพิมพ์ทศนิยมตามอัลกอริทึมของ Arduino Print::printFloat
  function printFloat(num, digits) {
    num = f32(num);
    if (Number.isNaN(num)) return "nan";
    if (!Number.isFinite(num)) return "inf";
    if (num > 4294967040.0) return "ovf";
    if (num < -4294967040.0) return "ovf";
    let s = "";
    if (num < 0) { s = "-"; num = f32(-num); }
    let rounding = 0.5;
    for (let i = 0; i < digits; i++) rounding = f32(rounding / 10.0);
    num = f32(num + rounding);
    const ip = Math.trunc(num);
    let rem = f32(num - ip);
    s += String(ip);
    if (digits > 0) s += ".";
    while (digits-- > 0) { rem = f32(rem * 10.0); const d = Math.trunc(rem); s += String(d); rem = f32(rem - d); }
    return s;
  }
  function printVal(v, digits) {
    if (v.t === "str") return v.v;
    if (v.t === "float") return printFloat(v.v, digits === undefined ? 2 : digits);
    if (v.t === "char" && digits === undefined) return String.fromCharCode(v.v & 0xFF);
    if (digits !== undefined && [2, 8, 16].includes(digits)) {
      let n = v.v; if (n < 0) n = mod(n, 4294967296);
      return n.toString(digits).toUpperCase();
    }
    return String(v.v);
  }
  function showVal(v) {
    if (!v) return "—";
    if (v.t === "bool") return v.v ? "true" : "false";
    if (v.t === "float") { const s = String(Number(v.v.toPrecision(7))); return s.includes(".") || s.includes("e") ? s : s + ".0"; }
    if (v.t === "str") return JSON.stringify(v.v);
    return String(v.v);
  }
  const HL = (v) => (v ? "HIGH" : "LOW");

  // ---------------- ค่าคงที่ของ Arduino ----------------
  const CONSTS = {
    HIGH: V("int", 1), LOW: V("int", 0), INPUT: V("int", 0), OUTPUT: V("int", 1), INPUT_PULLUP: V("int", 2),
    LED_BUILTIN: V("int", 13), true: V("bool", 1), false: V("bool", 0), PI: V("float", f32(Math.PI)),
    A0: V("int", 14), A1: V("int", 15), A2: V("int", 16), A3: V("int", 17), A4: V("int", 18), A5: V("int", 19),
    RISING: V("int", 3), FALLING: V("int", 2), CHANGE: V("int", 1),
  };
  const pinName = (p) => (p >= 14 && p <= 19 ? "A" + (p - 14) : String(p));

  // ---------------- สัญญาณควบคุมการไหล ----------------
  const BREAK = { sig: "break" }, CONTINUE = { sig: "continue" };
  class Ret { constructor(v) { this.sig = "return"; this.v = v; } }

  // ---------------- เครื่องจำลอง ----------------
  class Machine {
    // io: { digitalIn(pin, mode) -> 0/1, analogIn(pin) -> 0..1023, serial(text) }
    constructor(prog, io) {
      this.prog = prog;
      this.io = io || {};
      this.globals = new Map();
      this.frames = [];
      this.pins = {};           // pin -> { mode, out, pwm }
      this.time = 0;            // มิลลิวินาทีจำลอง
      this.notes = {};          // line -> { t, k }
      this.curLine = 0;
      this.iter = 0;
      this.lastCond = {};       // line -> 0/1
      this.serialOut = "";
      this.seq = 0;
      this.staleSeq = 0;
      this.isr = {};            // pin -> { name, mode }
      this.irq = [];            // ISR ที่รอทำ
      this.irqOn = true;
      this.inISR = false;
      this.saved = null;
      this.lastDelayMs = 0;
      this.loopEmpty = prog.funcs.loop.body.body.length === 0;
      this.gen = this.run();
      this.pause = null;        // จุดหยุดถัดไป { line, kind }
      this.done = false;
      this.advance();           // ไปหยุดที่จุดแรก
    }
    advance() {
      const r = this.gen.next();
      if (r.done) {
        if (this.inISR) { this.gen = this.saved.gen; this.pause = this.saved.pause; this.inISR = false; this.saved = null; }
        else { this.done = true; this.pause = null; }
      } else this.pause = r.value;
      return this.pause;
    }
    step() {
      if (this.done) return null;
      this.lastDelayMs = 0;
      // มีอินเทอร์รัปต์รออยู่: หยุดงานปัจจุบันไว้ แล้วไปทำ ISR
      if (!this.inISR && this.irqOn && this.irq.length && this.pause && this.pause.kind !== "idle") {
        const name = this.irq.shift();
        const back = this.pause;
        this.saved = { gen: this.gen, pause: this.pause };
        this.inISR = true;
        this.gen = this.isrRun(name);
        this.advance();
        return { line: back.line, kind: "irqEnter", isr: name };
      }
      const executed = this.pause;
      this.advance();
      return executed;
    }
    *isrRun(name) {
      const f = this.prog.funcs[name];
      this.isrDepthLine = f.line;
      yield* this.callUser(name, [], false, true);
    }
    // แจ้งว่าแรงดันที่ขาเปลี่ยน (จากอุปกรณ์ภายนอก) เพื่อสร้างอินเทอร์รัปต์
    extEdge(pin, from, to) {
      const a = this.isr[pin];
      if (!a || from === to) return;
      const ok = a.mode === 1 ? true : a.mode === 2 ? (from === 1 && to === 0) : a.mode === 3 ? (from === 0 && to === 1) : to === 0;
      if (ok) { this.irq.push(a.name); if (this.irq.length > 50) this.irq.shift(); }
    }
    note(t, k = "") { if (this.curLine) this.notes[this.curLine] = { t, k, seq: ++this.seq }; }
    *run() {
      for (const d of this.prog.globals) { yield { line: d.line, kind: "stmt" }; this.curLine = d.line; yield* this.declare(d, this.globals, true); }
      yield* this.callUser("setup", []);
      if (this.loopEmpty) { yield { line: this.prog.funcs.loop.line, kind: "idle" }; return; }
      for (;;) {
        yield* this.callUser("loop", [], true);
      }
    }
    // ---------- ตัวแปร ----------
    scopeChain() { const f = this.frames[this.frames.length - 1]; return f ? f.scopes : []; }
    lookup(name, line) {
      const sc = this.scopeChain();
      for (let i = sc.length - 1; i >= 0; i--) if (sc[i].has(name)) return sc[i].get(name);
      if (this.globals.has(name)) return this.globals.get(name);
      return null;
    }
    *declare(d, scope, isGlobal) {
      const parts = [];
      for (const v of d.vars) {
        if (scope.has(v.name) && !isGlobal) throw new SimError(`ประกาศตัวแปร ${v.name} ซ้ำ`, d.line);
        if (v.size) {
          let n = v.size.k === "auto" ? (v.init && v.init.k === "list" ? v.init.items.length : 0) : (yield* this.eval(v.size)).v;
          const arr = [];
          for (let i = 0; i < n; i++) arr.push(V(d.ty, d.ty === "float" ? 0 : 0));
          if (v.init && v.init.k === "list") {
            if (v.init.items.length > n) throw new SimError(`ค่าเริ่มต้นมากกว่าขนาดอาร์เรย์ ${v.name}`, d.line);
            for (let i = 0; i < v.init.items.length; i++) arr[i] = conv(yield* this.eval(v.init.items[i]), d.ty);
          }
          scope.set(v.name, { ty: d.ty, arr, isConst: d.isConst, isArray: true });
          parts.push(`${v.name} = {${arr.map(showVal).join(", ")}}`);
        } else {
          let val = V(d.ty, 0);
          if (v.init) val = conv(yield* this.eval(v.init), d.ty);
          else if (!isGlobal) val = { t: d.ty, v: 0, unset: true };
          scope.set(v.name, { ty: d.ty, val, isConst: d.isConst });
          parts.push(v.init || isGlobal ? `${v.name} = ${showVal(val)}` : `${v.name} ยังไม่มีค่า`);
        }
      }
      this.note(parts.join(", "));
    }
    // ---------- ฟังก์ชันของผู้ใช้ ----------
    *callUser(name, args, isLoop, isISR) {
      const f = this.prog.funcs[name];
      const scope = new Map();
      f.params.forEach((pr, i) => scope.set(pr.name, { ty: pr.ty, val: conv(args[i], pr.ty) }));
      this.frames.push({ name, scopes: [scope] });
      let ret = null;
      try {
        yield* this.execBlockBody(f.body.body);
      } catch (e) {
        if (e instanceof Ret) ret = e.v;
        else if (e === BREAK || e === CONTINUE) throw new SimError("ใช้ break หรือ continue นอกลูป", this.curLine);
        else throw e;
      }
      yield { line: f.endLine, kind: isLoop ? "loopEnd" : isISR ? "isrEnd" : "funcEnd", func: name };
      this.curLine = f.endLine;
      if (isLoop) { this.iter++; this.staleSeq = this.seq; this.note("จบรอบ วนกลับไปต้น loop()"); }
      else if (name === "setup") this.note("setup() ทำงานเสร็จ");
      else if (isISR) this.note("ISR จบ กลับไปทำงานต่อที่เดิม");
      else this.note(ret ? `ส่งค่า ${showVal(ret)} กลับ` : "กลับไปยังผู้เรียก");
      this.frames.pop();
      if (f.ty !== "void") {
        if (!ret) throw new SimError(`ฟังก์ชัน ${name} ไม่ได้ส่งค่ากลับ`, f.endLine);
        return conv(ret, f.ty);
      }
      return V("void", 0);
    }
    // ---------- คำสั่ง ----------
    *execBlockBody(list) {
      const sc = this.scopeChain();
      sc.push(new Map());
      try { for (const s of list) yield* this.exec(s); } finally { sc.pop(); }
    }
    *exec(s) {
      switch (s.k) {
        case "block": return yield* this.execBlockBody(s.body);
        case "empty": return;
        case "decl": {
          yield { line: s.line, kind: "stmt", node: s }; this.curLine = s.line;
          const sc = this.scopeChain();
          return yield* this.declare(s, sc[sc.length - 1], false);
        }
        case "expr": {
          yield { line: s.line, kind: "stmt", node: s }; this.curLine = s.line;
          this.pendingNote = null;
          const v = yield* this.eval(s.e, true);
          this.curLine = s.line;
          if (this.pendingNote) this.note(this.pendingNote);
          else if (v && v.t !== "void") this.note(`ได้ ${showVal(v)}`);
          return;
        }
        case "if": {
          yield { line: s.line, kind: "cond", node: s.cond }; this.curLine = s.line;
          const c = yield* this.cond(s.cond, s.line);
          if (c) return yield* this.execScoped(s.then);
          if (s.els) return yield* this.execScoped(s.els);
          return;
        }
        case "while": {
          for (;;) {
            yield { line: s.line, kind: "cond", node: s.cond }; this.curLine = s.line;
            if (!(yield* this.cond(s.cond, s.line))) return;
            try { yield* this.execScoped(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
          }
        }
        case "do": {
          for (;;) {
            try { yield* this.execScoped(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
            yield { line: s.condLine, kind: "cond", node: s.cond }; this.curLine = s.condLine;
            if (!(yield* this.cond(s.cond, s.condLine))) return;
          }
        }
        case "for": {
          const sc = this.scopeChain();
          sc.push(new Map());
          try {
            if (s.init) {
              yield { line: s.line, kind: "stmt", part: "init" }; this.curLine = s.line;
              if (s.init.k === "decl") yield* this.declare(s.init, sc[sc.length - 1], false);
              else { this.pendingNote = null; yield* this.eval(s.init.e, true); this.curLine = s.line; this.note("เริ่มต้น: " + (this.pendingNote || "")); }
            }
            for (;;) {
              if (s.cond) {
                yield { line: s.line, kind: "cond", node: s.cond, part: "cond" }; this.curLine = s.line;
                if (!(yield* this.cond(s.cond, s.line))) return;
              }
              try { yield* this.execScoped(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
              if (s.upd.length) {
                yield { line: s.line, kind: "stmt", part: "update" }; this.curLine = s.line;
                const notes = [];
                for (const u of s.upd) { this.pendingNote = null; yield* this.eval(u, true); if (this.pendingNote) notes.push(this.pendingNote); }
                this.curLine = s.line;
                this.note("เปลี่ยนค่า: " + notes.join(", "));
              }
            }
          } finally { sc.pop(); }
        }
        case "switch": {
          yield { line: s.line, kind: "stmt" }; this.curLine = s.line;
          const v = yield* this.eval(s.e);
          let start = -1;
          for (let i = 0; i < s.items.length; i++) {
            const it = s.items[i];
            if (it.k === "case") { const cv = yield* this.eval(it.v); if (compare("==", v, cv).v) { start = i; break; } }
          }
          if (start < 0) start = s.items.findIndex((it) => it.k === "default");
          this.curLine = s.line;
          this.note(start < 0 ? `ค่า ${showVal(v)} ไม่ตรงกับ case ใด` : `ค่า ${showVal(v)} ไปที่ ${s.items[start].k === "case" ? "case ที่ตรงกัน" : "default"}`);
          if (start < 0) return;
          const sc = this.scopeChain();
          sc.push(new Map());
          try {
            for (let i = start; i < s.items.length; i++) {
              const it = s.items[i];
              if (it.k === "case" || it.k === "default") continue;
              yield* this.exec(it);
            }
          } catch (e) { if (e !== BREAK) throw e; } finally { sc.pop(); }
          return;
        }
        case "break": yield { line: s.line, kind: "stmt" }; this.curLine = s.line; this.note("ออกจากลูปหรือ switch"); throw BREAK;
        case "continue": yield { line: s.line, kind: "stmt" }; this.curLine = s.line; this.note("ข้ามไปรอบถัดไป"); throw CONTINUE;
        case "return": {
          yield { line: s.line, kind: "stmt" }; this.curLine = s.line;
          const v = s.e ? yield* this.eval(s.e) : null;
          this.curLine = s.line;
          this.note(v ? `ส่งค่า ${showVal(v)}` : "ออกจากฟังก์ชัน");
          throw new Ret(v);
        }
      }
      throw new SimError("ยังไม่รองรับคำสั่งนี้", s.line);
    }
    *execScoped(s) {
      if (s.k === "block") return yield* this.execBlockBody(s.body);
      const sc = this.scopeChain();
      sc.push(new Map());
      try { yield* this.exec(s); } finally { sc.pop(); }
    }
    *cond(node, line) {
      const v = yield* this.eval(node);
      const r = truthy(v) ? 1 : 0;
      this.lastCond[line] = r;
      this.curLine = line;
      this.note(`${this.describe(node)}${r ? "เป็นจริง" : "เป็นเท็จ"}`, r ? "true" : "false");
      return r;
    }
    // อธิบายเงื่อนไขจากค่าที่คำนวณแล้ว (เก็บไว้ใน _last)
    describe(n) {
      const sv = (x) => (x && x._last ? showVal(x._last) : "?");
      if (n.k === "bin" && ["==", "!=", "<", ">", "<=", ">="].includes(n.op)) return `${sv(n.a)} ${n.op} ${sv(n.b)} `;
      if (n.k === "bin" && (n.op === "&&" || n.op === "||")) {
        const tf = (x) => (x._skip ? "(ไม่ต้องคำนวณ)" : x._last ? (truthy(x._last) ? "จริง" : "เท็จ") : "?");
        return `${tf(n.a)} ${n.op} ${tf(n.b)} `;
      }
      if (n.k === "un" && n.op === "!") return `!${n.a._last ? (truthy(n.a._last) ? "จริง" : "เท็จ") : "?"} `;
      return n._last ? `ค่า ${showVal(n._last)} ` : "";
    }
    // ---------- นิพจน์ ----------
    *eval(n, top) {
      const v = yield* this.evalInner(n, top);
      n._last = v; n._skip = false;
      return v;
    }
    *evalInner(n, top) {
      switch (n.k) {
        case "num": return numLiteral(n.raw, n.line);
        case "lit": return n.v;
        case "str": return V("str", n.v);
        case "var": {
          const ref = this.lookup(n.name, n.line);
          if (ref) {
            if (ref.isArray) throw new SimError(`${n.name} เป็นอาร์เรย์ ต้องระบุตำแหน่ง เช่น ${n.name}[0]`, n.line);
            return V(ref.val.t, ref.val.v);
          }
          if (CONSTS[n.name]) return CONSTS[n.name];
          throw new SimError(`ไม่รู้จักชื่อ ${n.name} (ยังไม่ได้ประกาศ หรือพิมพ์ผิด)`, n.line);
        }
        case "index": {
          const ref = this.lookup(n.arr.name, n.line);
          if (!ref || !ref.isArray) throw new SimError(`${n.arr.name} ไม่ใช่อาร์เรย์`, n.line);
          const i = (yield* this.eval(n.i)).v;
          if (i < 0 || i >= ref.arr.length) throw new SimError(`ใช้ ${n.arr.name}[${i}] เกินขนาดอาร์เรย์ (ดัชนีได้ 0 ถึง ${ref.arr.length - 1}) บอร์ดจริงจะไม่เตือนแต่ได้ค่าผิด`, n.line);
          return ref.arr[i];
        }
        case "comma": { yield* this.eval(n.a); return yield* this.eval(n.b); }
        case "tern": { const c = yield* this.eval(n.c); return truthy(c) ? yield* this.eval(n.a) : yield* this.eval(n.b); }
        case "cast": return conv(yield* this.eval(n.a), n.ty);
        case "un": {
          const a = yield* this.eval(n.a);
          if (n.op === "!") return V("bool", truthy(a) ? 0 : 1);
          if (n.op === "+") return conv(a, promote(a.t));
          if (n.op === "-") { const ty = promote(a.t); return V(ty, ty === "float" ? f32(-a.v) : wrap(ty, -a.v)); }
          if (n.op === "~") { const ty = promote(a.t); return V(ty, wrap(ty, -a.v - 1)); }
          break;
        }
        case "bin": {
          if (n.op === "&&" || n.op === "||") {
            const a = yield* this.eval(n.a);
            const short = n.op === "&&" ? !truthy(a) : truthy(a);
            if (short) { n.b._last = null; n.b._skip = true; return V("bool", n.op === "||" ? 1 : 0); }
            const b = yield* this.eval(n.b);
            return V("bool", truthy(b) ? 1 : 0);
          }
          const a = yield* this.eval(n.a), b = yield* this.eval(n.b);
          if (["==", "!=", "<", ">", "<=", ">="].includes(n.op)) return compare(n.op, a, b);
          return arith(n.op, a, b, n.line);
        }
        case "assign": {
          let rhs = yield* this.eval(n.value);
          const { ref, idx, name } = yield* this.target(n.target);
          if (ref.isConst) throw new SimError(`${name} เป็นค่าคงที่ (const) แก้ค่าไม่ได้`, n.line);
          const cur = idx === null ? ref.val : ref.arr[idx];
          if (n.op !== "=") rhs = arith(n.op.slice(0, -1), cur, rhs, n.line);
          const nv = conv(rhs, ref.ty);
          if (idx === null) ref.val = nv; else ref.arr[idx] = nv;
          if (top) this.pendingNote = `${name}${idx === null ? "" : "[" + idx + "]"} = ${showVal(nv)}`;
          return nv;
        }
        case "inc": {
          const { ref, idx, name } = yield* this.target(n.a);
          if (ref.isConst) throw new SimError(`${name} เป็นค่าคงที่ (const) แก้ค่าไม่ได้`, n.line);
          const cur = idx === null ? ref.val : ref.arr[idx];
          const nv = conv(arith(n.op === "++" ? "+" : "-", cur, V("int", 1), n.line), ref.ty);
          if (idx === null) ref.val = nv; else ref.arr[idx] = nv;
          if (top) this.pendingNote = `${name}${idx === null ? "" : "[" + idx + "]"} = ${showVal(nv)}`;
          return n.pre ? nv : cur;
        }
        case "call": return yield* this.call(n, top);
      }
      throw new SimError("ยังไม่รองรับนิพจน์นี้", n.line);
    }
    *target(t) {
      if (t.k === "var") {
        const ref = this.lookup(t.name, t.line);
        if (!ref) throw new SimError(CONSTS[t.name] ? `${t.name} เป็นค่าคงที่ของ Arduino แก้ค่าไม่ได้` : `ไม่รู้จักชื่อ ${t.name} (ยังไม่ได้ประกาศ หรือพิมพ์ผิด)`, t.line);
        if (ref.isArray) throw new SimError(`${t.name} เป็นอาร์เรย์ ต้องระบุตำแหน่ง`, t.line);
        return { ref, idx: null, name: t.name };
      }
      const ref = this.lookup(t.arr.name, t.line);
      if (!ref || !ref.isArray) throw new SimError(`${t.arr.name} ไม่ใช่อาร์เรย์`, t.line);
      const i = (yield* this.eval(t.i)).v;
      if (i < 0 || i >= ref.arr.length) throw new SimError(`ใช้ ${t.arr.name}[${i}] เกินขนาดอาร์เรย์ (ดัชนีได้ 0 ถึง ${ref.arr.length - 1}) บอร์ดจริงจะไม่เตือนแต่เขียนทับข้อมูลอื่น`, t.line);
      return { ref, idx: i, name: t.arr.name };
    }
    pin(p) { if (!this.pins[p]) this.pins[p] = { mode: null, out: 0, pwm: null }; return this.pins[p]; }
    *call(n, top) {
      if (n.name === "attachInterrupt") {
        if (n.args.length < 3 || n.args[1].k !== "var" || !this.prog.funcs[n.args[1].name]) throw new SimError("attachInterrupt() ต้องระบุ (หมายเลขอินเทอร์รัปต์, ชื่อฟังก์ชัน ISR, โหมด)", n.line);
        const num = (yield* this.eval(n.args[0])).v, mode = (yield* this.eval(n.args[2])).v;
        const pin = num === 0 ? 2 : num === 1 ? 3 : -1;
        if (pin < 0) throw new SimError("Arduino Uno มีอินเทอร์รัปต์ภายนอกเฉพาะขา 2 และ 3", n.line);
        this.isr[pin] = { name: n.args[1].name, mode };
        if (top) this.pendingNote = `ขา ${pin} เกิดเหตุการณ์แล้วไปทำ ${n.args[1].name}()`;
        return V("void", 0);
      }
      const args = [];
      for (const a of n.args) args.push(yield* this.eval(a));
      const need = (k) => { if (args.length < k) throw new SimError(`${n.name}() ต้องมีค่าที่ส่งเข้า ${k} ค่า`, n.line); };
      const say = (t) => { if (top) this.pendingNote = t; };
      if (this.prog.funcs[n.name]) {
        const f = this.prog.funcs[n.name];
        if (args.length !== f.params.length) throw new SimError(`${n.name}() ต้องมีค่าที่ส่งเข้า ${f.params.length} ค่า`, n.line);
        const callerLine = this.curLine;
        const v = yield* this.callUser(n.name, args);
        this.curLine = callerLine;
        if (top && f.ty === "void") this.pendingNote = `เรียก ${n.name}() เสร็จ`;
        return v;
      }
      switch (n.name) {
        case "pinMode": {
          need(2); const p = args[0].v, m = args[1].v; this.pin(p).mode = m;
          if (m === 1) { this.pin(p).out = 0; }
          say(`ขา ${pinName(p)} เป็น${m === 1 ? "เอาต์พุต" : m === 2 ? "อินพุต + pull-up" : "อินพุต"}`);
          return V("void", 0);
        }
        case "digitalWrite": {
          need(2); const p = args[0].v, val = truthy(args[1]) ? 1 : 0; const pn = this.pin(p);
          pn.out = val; pn.pwm = null;
          say(pn.mode === 1 ? `ขา ${pinName(p)} = ${HL(val)}` : `ขา ${pinName(p)} ยังไม่ได้ตั้งเป็น OUTPUT (ลืม pinMode?)`);
          return V("void", 0);
        }
        case "digitalRead": {
          need(1); const p = args[0].v; const pn = this.pin(p);
          const v = this.io.digitalIn ? this.io.digitalIn(p, pn.mode) : 0;
          say(`อ่านขา ${pinName(p)} ได้ ${HL(v)}`);
          return V("int", v ? 1 : 0);
        }
        case "analogRead": {
          need(1); let p = args[0].v; if (p < 14) p += 14;
          const v = this.io.analogIn ? Math.max(0, Math.min(1023, Math.round(this.io.analogIn(p)))) : 0;
          say(`อ่านขา ${pinName(p)} ได้ ${v}`);
          return V("int", v);
        }
        case "analogWrite": {
          need(2); const p = args[0].v; const d = wrap("int", args[1].v); const pn = this.pin(p);
          const duty = Math.max(0, Math.min(255, d));
          pn.pwm = duty; pn.out = duty >= 128 ? 1 : 0; if (pn.mode === null) pn.mode = 1;
          say(`ขา ${pinName(p)} PWM ${duty}/255 (${Math.round(duty / 2.55)}%)`);
          return V("void", 0);
        }
        case "delay": {
          need(1); const ms = args[0].v; this.time += ms; this.lastDelayMs = ms; say(`รอ ${ms} ms (เวลาจำลอง ${this.time} ms)`);
          return V("void", 0);
        }
        case "delayMicroseconds": { need(1); this.time += args[0].v / 1000; return V("void", 0); }
        case "digitalPinToInterrupt": { need(1); const p = args[0].v; return V("int", p === 2 ? 0 : p === 3 ? 1 : -1); }
        case "noInterrupts": this.irqOn = false; say("ปิดอินเทอร์รัปต์ชั่วคราว"); return V("void", 0);
        case "interrupts": this.irqOn = true; say("เปิดอินเทอร์รัปต์"); return V("void", 0);
        case "pulseIn": {
          need(2); const p = args[0].v, lv = args[1].v, to = args[2] ? args[2].v : 1000000;
          let us = this.io.pulseIn ? this.io.pulseIn(p, lv, to) : 0;
          if (us > to) us = 0;
          this.time += (us || to) / 1000;
          say(us ? `วัดพัลส์ที่ขา ${pinName(p)} ได้ ${us} µs` : `ไม่พบพัลส์ภายใน ${to} µs ได้ 0`);
          return V("ulong", us);
        }
        case "millis": return V("ulong", Math.floor(this.time));
        case "micros": return V("ulong", Math.floor(this.time * 1000));
        case "map": {
          need(5);
          const [x, a, b, c, d] = args.map((v) => conv(v, "long").v);
          if (b === a) throw new SimError("map(): ช่วงเดิมกว้างเป็นศูนย์", n.line);
          return V("long", wrap("long", Math.trunc(mulExact(x - a, d - c) / (b - a)) + c));
        }
        case "constrain": { need(3); const [x, a, b] = args; return compare("<", x, a).v ? a : compare(">", x, b).v ? b : x; }
        case "min": { need(2); return compare("<", args[0], args[1]).v ? args[0] : args[1]; }
        case "max": { need(2); return compare(">", args[0], args[1]).v ? args[0] : args[1]; }
        case "abs": { need(1); const a = args[0]; return compare("<", a, V("int", 0)).v ? V(promote(a.t), a.t === "float" ? f32(-a.v) : wrap(promote(a.t), -a.v)) : a; }
        case "sqrt": { need(1); return V("float", f32(Math.sqrt(conv(args[0], "float").v))); }
        case "pow": { need(2); return V("float", f32(Math.pow(conv(args[0], "float").v, conv(args[1], "float").v))); }
        case "Serial.begin": say(`เริ่ม Serial ที่ ${args[0] ? args[0].v : 9600} บิต/วินาที`); return V("void", 0);
        case "Serial.print":
        case "Serial.println": {
          let text = args.length ? printVal(args[0], args[1] ? args[1].v : undefined) : "";
          if (n.name === "Serial.println") text += "\n";
          this.serialOut += text;
          if (this.io.serial) this.io.serial(text);
          say(`พิมพ์ ${JSON.stringify(text.replace(/\n$/, ""))}${n.name === "Serial.println" ? " แล้วขึ้นบรรทัดใหม่" : ""}`);
          return V("void", 0);
        }
      }
      throw new SimError(`ตัวจำลองนี้ยังไม่รองรับฟังก์ชัน ${n.name}()`, n.line);
    }
    // ---------- ข้อมูลสำหรับหน้าจอ ----------
    visibleVars() {
      const out = [];
      for (const [k, r] of this.globals) out.push({ name: k, ty: r.ty, scope: "ส่วนกลาง", r });
      const f = this.frames[this.frames.length - 1];
      if (f) for (const sc of f.scopes) for (const [k, r] of sc) out.push({ name: k, ty: r.ty, scope: f.name + "()", r });
      return out;
    }
    readVar(name) {
      const r = this.lookup(name);
      if (!r) return null;
      if (r.isArray) return "{" + r.arr.map(showVal).join(", ") + "}";
      return r.val.unset ? "ยังไม่มีค่า" : showVal(r.val);
    }
  }

  function findFirst(prog, kind) {
    let found = null;
    const walk = (s) => {
      if (!s || found) return;
      if (s.k === kind) { found = s; return; }
      if (s.k === "block") s.body.forEach(walk);
      else if (s.k === "if") { walk(s.then); walk(s.els); }
      else if (s.k === "while" || s.k === "for" || s.k === "do") walk(s.body);
      else if (s.k === "switch") s.items.forEach(walk);
    };
    for (const name of ["setup", "loop"].concat(Object.keys(prog.funcs))) if (prog.funcs[name]) walk(prog.funcs[name].body);
    return found;
  }
  function exprStr(n) {
    switch (n.k) {
      case "num": return n.raw;
      case "lit": return "'" + String.fromCharCode(n.v.v) + "'";
      case "str": return JSON.stringify(n.v);
      case "var": return n.name;
      case "index": return `${n.arr.name}[${exprStr(n.i)}]`;
      case "un": return n.op + exprStr(n.a);
      case "bin": return `${exprStr(n.a)} ${n.op} ${exprStr(n.b)}`;
      case "call": return `${n.name}(${n.args.map(exprStr).join(", ")})`;
      case "assign": return `${exprStr(n.target)} ${n.op} ${exprStr(n.value)}`;
      case "inc": return n.pre ? n.op + exprStr(n.a) : exprStr(n.a) + n.op;
      case "cast": return `(${n.ty})${exprStr(n.a)}`;
      case "tern": return `${exprStr(n.c)} ? ${exprStr(n.a)} : ${exprStr(n.b)}`;
    }
    return "";
  }
  function varsIn(n, out = new Set()) {
    if (!n || typeof n !== "object") return out;
    if (n.k === "var" && !n.name.includes(".")) out.add(n.name);
    if (n.k === "index") out.add(n.arr.name);
    for (const key of ["a", "b", "c", "i", "value", "target"]) if (n[key]) varsIn(n[key], out);
    if (n.args) n.args.forEach((x) => varsIn(x, out));
    return out;
  }

  const API = { tokenize, parse, Machine, SimError, showVal, printFloat, pinName, CONSTS, findFirst, exprStr, varsIn };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else global.ArduinoCore = API;
})(typeof window !== "undefined" ? window : globalThis);
