// ตัวอย่างเพิ่มเติม char เทียบกับ uint8_t
void setup() {
  Serial.begin(9600);
  char c = 65;                // char เก็บรหัสของตัวอักษร
  uint8_t n = 65;             // uint8_t (byte) เก็บตัวเลข 0 ถึง 255
  Serial.println(c);          // พิมพ์ A
  Serial.println(n);          // พิมพ์ 65
  char k = 'B';               // ใส่ตัวอักษรในเครื่องหมาย ' '
  Serial.println(k);          // พิมพ์ B
  char t = 200;               // char เก็บได้ -128 ถึง 127
  Serial.println((int)t);     // พิมพ์ -56 ไม่ใช่ 200
}

void loop() {
}
