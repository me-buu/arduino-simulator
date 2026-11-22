// ตัวอย่างที่ 4.3 ไฟส่องสว่างอัตโนมัติ: มืดแล้วไฟติด
const int LDR_PIN = A1;
const int LED_PIN = 8;
const int DARK_LEVEL = 300;         // ค่าเกณฑ์ ได้จากการวัดค่าตอนมืดและตอนสว่าง

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int light = analogRead(LDR_PIN);
  if (light < DARK_LEVEL) {
    digitalWrite(LED_PIN, HIGH);    // มืด เปิดไฟ
  } else {
    digitalWrite(LED_PIN, LOW);     // สว่าง ปิดไฟ
  }
  Serial.println(light);
  delay(200);
}
