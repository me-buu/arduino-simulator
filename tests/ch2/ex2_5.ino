// ตัวอย่างที่ 2.5 ตัดสินใจตามอุณหภูมิน้ำมันไฮดรอลิก
void setup() {
  Serial.begin(9600);
  float oilTemp = 72.5;           // อุณหภูมิน้ำมัน (°C) สมมติว่าอ่านจากเซนเซอร์

  if (oilTemp > 80.0) {
    Serial.println("ALARM");      // ร้อนเกิน ต้องหยุดปั๊ม
  } else if (oilTemp > 60.0) {
    Serial.println("WARNING");    // อุ่น ให้เปิดพัดลมระบายความร้อน
  } else {
    Serial.println("NORMAL");     // อุณหภูมิปกติ
  }
}

void loop() {
}
