// ตัวอย่างที่ 2.1 โครงสร้างโปรแกรม Arduino
void setup() {
  Serial.begin(9600);            // เริ่มการสื่อสารอนุกรมที่ 9600 บิตต่อวินาที
  Serial.println("Hello BUU");   // ทำงานครั้งเดียวตอนเริ่มโปรแกรม
}

void loop() {
  Serial.println("loop");        // ทำงานซ้ำไม่รู้จบ
  delay(1000);                   // หน่วงเวลา 1000 ms = 1 วินาที
}
