// ตัวอย่างที่ 3.8 นับชิ้นงานด้วยอินเทอร์รัปต์ที่ขา 2
const int SENSOR_PIN = 2;          // ปุ่มกดแทนสวิตช์ตรวจชิ้นงาน
volatile byte count = 0;          // ตัวแปรที่ ISR แก้ไข ต้องเป็น volatile
byte lastShown = 0;                // ค่าที่แสดงครั้งล่าสุด

void countISR() {                  // ISR: สั้นที่สุด ไม่มี delay และไม่มี Serial
  count++;
}

void setup() {
  Serial.begin(9600);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  // กดปุ่ม = สัญญาณเปลี่ยนจาก HIGH เป็น LOW (ขอบขาลง)
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), countISR, FALLING);
}

void loop() {
  if (count != lastShown) {        // แสดงผลเฉพาะเมื่อค่าเปลี่ยน
    lastShown = count;
    Serial.print("Count = ");
    Serial.println(lastShown);
  }
  // งานอื่นของระบบทำต่อได้ตามปกติ การนับไม่พลาดแม้ loop ทำงานช้า
  delay(1000);
}
