// รันโปรแกรมด้วยตัวแปลภาษา แล้วพิมพ์ผล Serial (ใช้เทียบกับ simavr)
const C = require("../engine/arduino-core.js");
const fs = require("fs");
const file = process.argv[2], maxSteps = +(process.argv[3] || 20000);
const src = fs.readFileSync(file, "utf8");
try {
  const m = new C.Machine(C.parse(src), { digitalIn: () => 1, analogIn: () => 512 });
  let n = 0;
  while (!m.done && n < maxSteps) { m.step(); n++; }
  process.stdout.write(m.serialOut);
} catch (e) { console.log("ERROR: " + e.message); }
