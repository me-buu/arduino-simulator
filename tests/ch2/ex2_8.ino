// ตัวอย่างที่ 2.8 จำลองการเติมน้ำเข้าถังด้วย while
void setup() {
  Serial.begin(9600);
  float level = 0.0;              // ระดับน้ำในถัง (cm)
  int seconds = 0;                // เวลาที่ผ่านไป (s)

  while (level < 50.0) {          // ทำซ้ำตราบที่ระดับน้ำยังไม่ถึง 50 cm
    level = level + 3.5;          // ระดับน้ำเพิ่มขึ้น 3.5 cm ทุกวินาที
    seconds++;                    // เพิ่มค่าขึ้น 1
  }
  Serial.print("Time to fill = ");
  Serial.print(seconds);
  Serial.println(" s");
}

void loop() {
}
