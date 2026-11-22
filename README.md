# ตัวจำลอง Arduino สำหรับการสอน

ออกแบบให้ใช้บนโน้ตบุ๊กหรือ iPad

เดินโค้ด Arduino ทีละบรรทัด ดูค่าตัวแปร สถานะขา และผลบนบอร์ดเสมือน
ใช้ประกอบวิชา 50335264 อิเล็กทรอนิกส์และระบบสมองกลฝังตัว

## โครงสร้าง

```
index.html               หน้ารวมตัวจำลอง แยกตามบท
engine/arduino-core.js   ตัวแปลภาษา Arduino (C++ ชุดย่อย) ไม่ขึ้นกับหน้าเว็บ
engine/arduino-sim.js    หน้าจอ: โค้ด บอร์ด ตัวแปร Serial Monitor ตาราง ภารกิจ
engine/arduino-sim.css   หน้าตาร่วมของทุกตัวจำลอง
demos/*.html             ตัวจำลองแต่ละตัว มีเฉพาะค่าตั้ง (โค้ด อุปกรณ์ ภารกิจ)
tests/                   ทดสอบตัวแปลภาษาเทียบกับ Arduino Uno จริง
build.py                 รวมทุกอย่างเป็นไฟล์เดียวต่อตัวจำลองไว้ใน dist/
```

## เปิดบน GitHub Pages

1. push ทั้งโฟลเดอร์ขึ้น repository
2. Settings > Pages > Source เลือก branch main และโฟลเดอร์ / (root)
3. เปิด https://<ชื่อผู้ใช้>.github.io/<ชื่อ repo>/

ไม่ต้องมี server หรือขั้นตอน build ถ้าต้องการไฟล์เดียวไว้ส่งต่อหรือเปิดแบบไม่มีโฟลเดอร์ engine ให้รัน `python3 build.py`

## เพิ่มตัวจำลองใหม่

คัดลอกไฟล์ใน demos/ มาแก้ค่าใน `ArduinoSim.mount({...})`

| ค่า | ความหมาย |
|---|---|
| title, lede | ชื่อและคำอธิบายสั้น |
| back | ลิงก์กลับหน้ารวม (เช่น "../index.html") |
| serial | true ถ้าต้องการ Serial Monitor |
| board | อุปกรณ์บนบอร์ด: `{type:"led", pin, color, label}`, `{type:"slide", pin, label, on, off}`, `{type:"button", pin, label}`, `{type:"pot", pin:"A0", label, min, max, unit, init}` |
| trace | ตารางติดตามค่า: `at:"loopEnd"` (หนึ่งแถวต่อรอบ loop) หรือ `stmt:"for", on:"cond"` (ทุกครั้งที่ตรวจเงื่อนไขของคำสั่ง for แรก) และ `cols` ได้แก่ `{var}`, `{pin}`, `{cond}`, `{iter}`, `{n}`, `{time}` เติม `hl:true` เพื่อไฮไลต์แถวที่เป็นจริงหรือ HIGH และ `dedupe:true` เพื่อเพิ่มแถวเฉพาะเมื่อค่าเปลี่ยน |
| missions | ภารกิจ: `{title, text, q, code, predict, predictVars, editable, speed, inputs}` โดย `predict:true` ให้ทำนายเงื่อนไขทุกครั้ง, `predictVars:["x"]` ให้ทำนายค่าก่อนบรรทัดที่กำหนดค่าตัวแปร x, `inputs` คือค่าเริ่มต้นของอุปกรณ์ตามลำดับใน board |

หลักการออกแบบ: ภารกิจละ 1 คำถาม ไม่มีตัวเลือกให้ปรับ เปิดหน้ามาแล้วรันภารกิจ 1 ได้ทันที และให้ทำนายก่อนดูผลเสมอ

## สัญญาอนุญาต

- ซอฟต์แวร์ (engine/, build.py, tests/) ใช้สัญญาอนุญาต MIT ดูไฟล์ LICENSE
- เนื้อหา (ข้อความ ภารกิจ คำถาม และโค้ดตัวอย่างในภารกิจ) ใช้ CC BY 4.0 ดูไฟล์ LICENSE-CONTENT.md
- ตัวจำลองที่อาจารย์ท่านอื่นนำมาฝาก ให้ระบุชื่อผู้สร้างและสัญญาอนุญาตไว้ในหน้าของตัวจำลองนั้น

## สิ่งที่ตัวแปลภาษารองรับ

ชนิดข้อมูล int (16 บิต), unsigned int, long, unsigned long, float (double เท่ากับ float), bool, byte, char, อาร์เรย์หนึ่งมิติ, ฟังก์ชันที่ผู้ใช้เขียน,
if / else, for, while, do-while, switch-case, break, continue, return, ตัวดำเนินการทางคณิตศาสตร์ เปรียบเทียบ ตรรกะ บิต และ ?:,
pinMode, digitalRead, digitalWrite, analogRead, analogWrite, delay, millis, map, constrain, min, max, abs, sqrt, pow,
Serial.begin, Serial.print, Serial.println (รวมจำนวนทศนิยมและฐาน 2, 8, 16)

ยังไม่รองรับ: ไลบรารี (#include), #define, คลาส, pointer, String, อินเทอร์รัปต์

## การทดสอบ

`node tests/run.js โปรแกรม.ino` พิมพ์ผล Serial จากตัวแปลภาษา ผลถูกเทียบกับ avr-gcc + simavr
(ATmega328P จริง) แล้วทุกบรรทัดสำหรับโปรแกรมในบทที่ 2 ทั้ง 16 โปรแกรม (tests/ch2/), โค้ดของตัวจำลองทุกตัว และ tests/edge1.ino ที่ทดสอบการล้นของ int,
การหารจำนวนเต็ม, การพิมพ์ทศนิยม, switch ที่ไม่มี break และกรณีขอบอื่น ๆ
