// ตัวอย่างที่ 2.3 ระวังขนาดของ int บน Arduino Uno (16 บิต)
void setup() {
  Serial.begin(9600);
  int rpm = 3000;                      // ความเร็วรอบ (รอบ/นาที)
  int minutes = 20;                    // เวลาเดินเครื่อง (นาที)
  int revInt = rpm * minutes;          // ผิด: 60000 เกินช่วงของ int
  long revLong = (long)rpm * minutes;  // ถูก: แปลงเป็น long ก่อนคูณ
  Serial.println(revInt);              // ได้ -5536
  Serial.println(revLong);             // ได้ 60000
}

void loop() {
}
