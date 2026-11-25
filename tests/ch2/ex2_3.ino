// ตัวอย่างที่ 2.3 การล้นของตัวแปร
void setup() {
  Serial.begin(9600);
  // ล้นเล็กน้อย: เกินช่วงเพียง 1
  byte b = 255;
  b = b + 1;                           // 256 เกินช่วง 0 ถึง 255
  Serial.println(b);                   // ได้ 0
  int i = 32767;
  i = i + 1;                           // 32768 เกินช่วงของ int
  Serial.println(i);                   // ได้ -32768
  unsigned int u = 0;
  u = u - 1;                           // -1 ต่ำกว่าช่วง 0 ถึง 65535
  Serial.println(u);                   // ได้ 65535

  // ล้นมาก: ตัวอย่างงานจริง
  int rpm = 3000;                      // ความเร็วรอบ (รอบ/นาที)
  int minutes = 20;                    // เวลาเดินเครื่อง (นาที)
  int revInt = rpm * minutes;          // ผิด: 60000 เกินช่วงของ int
  long revLong = (long)rpm * minutes;  // ถูก: แปลงเป็น long ก่อนคูณ
  Serial.println(revInt);              // ได้ -5536
  Serial.println(revLong);             // ได้ 60000
}

void loop() {
}
